"""
Google Search API Router
Endpoints:
  POST /api/google/sync       — Start the scraper (runs in a real thread)
  POST /api/google/stop       — Stop the scraper gracefully
  GET  /api/google/sync/status — Poll sync state
  GET  /api/google/stats      — Summary statistics
  GET  /api/google/results    — Results grouped by date (type=all|filtered)
  GET  /api/google/export/{type} — Download as Excel
"""
import json
import io
import threading
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date

from app.database import get_db
from app.models import GoogleResult
from app.utils.logger import get_logger

logger = get_logger("google_api")
router = APIRouter(prefix="/api/google", tags=["google"])

# ── Shared state ──────────────────────────────────────────────────────────────
_stop_event   = threading.Event()   # set() to request stop
_sync_thread  = None                # reference to running thread
_sync_status  = {
    "running":  False,
    "stopped":  False,
    "last_run": None,
    "message":  "Never synced",
    "saved_all": 0,
    "saved_filtered": 0,
}


# ── Scraper thread ────────────────────────────────────────────────────────────

def _run_scraper(db_session_factory):
    """Run GoogleSearchScraper in a thread; respect _stop_event for clean stop."""
    global _sync_status, _sync_thread
    _sync_status.update(running=True, stopped=False, message="Scraper starting…",
                        saved_all=0, saved_filtered=0)
    _stop_event.clear()
    logger.info("Google scraper thread started")

    scraper = None
    try:
        from app.api.google import GoogleSearchScraper

        scraper = GoogleSearchScraper(headless=False)

        # ── Inject stop check into scraper ──
        # We monkey-patch the inner loop to check _stop_event between pages.
        original_search = scraper.search_with_suffix

        def stoppable_search(base_phrase, suffix, max_pages=7):
            if _stop_event.is_set():
                return []
            return original_search(base_phrase, suffix, max_pages)

        scraper.search_with_suffix = stoppable_search

        _sync_status["message"] = "Searching Google pages…"
        results_all, results_filtered = scraper.run_full_search(max_pages=7)

        if _stop_event.is_set():
            _sync_status["message"] = "Stopped by user — saving partial results…"
            logger.info("Scraper stopped by user; saving partial results")

        db = db_session_factory()
        try:
            saved_all      = _save_results(db, results_all, "all")
            saved_filtered = _save_results(db, results_filtered, "filtered")
            db.commit()
            stopped = _stop_event.is_set()
            msg = (
                f"Stopped — saved {saved_all} all-results, {saved_filtered} filtered"
                if stopped else
                f"Done — saved {saved_all} all-results, {saved_filtered} filtered"
            )
            _sync_status.update(
                running=False, stopped=stopped,
                last_run=datetime.utcnow().isoformat(),
                message=msg, saved_all=saved_all, saved_filtered=saved_filtered,
            )
            logger.info(msg)
        finally:
            db.close()

    except Exception as exc:
        logger.exception("Google scraper error: %s", exc)
        _sync_status.update(
            running=False, stopped=False,
            last_run=datetime.utcnow().isoformat(),
            message=f"Error: {exc}",
        )
    finally:
        if scraper:
            try:
                scraper.close()
            except Exception:
                pass
        _sync_thread = None


def _save_results(db: Session, results: list, result_type: str) -> int:
    existing_links = {
        r.link
        for r in db.query(GoogleResult.link)
                   .filter(GoogleResult.result_type == result_type)
                   .all()
    }
    count = 0
    for r in results:
        link = r.get("link", "")
        if not link or link in existing_links:
            continue
        existing_links.add(link)
        kws = r.get("keywords", [])
        db.add(GoogleResult(
            result_type  = result_type,
            title        = (r.get("title") or "")[:800],
            description  = r.get("description") or "",
            link         = link[:1000],
            search_query = (r.get("search_query") or "")[:500],
            keywords     = json.dumps(kws),
            page_excerpt = r.get("page_excerpt") or "",
            is_pdf       = "true" if r.get("is_pdf") else "false",
        ))
        count += 1
    return count


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/sync")
def sync_google():
    """Start the Google scraper in a background thread."""
    global _sync_thread
    if _sync_status["running"]:
        return {"status": "already_running", "message": "Scraper is already running"}

    from app.database import SessionLocal
    _stop_event.clear()
    _sync_thread = threading.Thread(
        target=_run_scraper, args=(SessionLocal,), daemon=True, name="google-scraper"
    )
    _sync_thread.start()
    _sync_status["running"] = True
    _sync_status["message"] = "Sync started — searching Google…"
    return {"status": "started", "message": "Google scraper started"}


@router.post("/stop")
def stop_google():
    """Signal the scraper thread to stop after the current page."""
    if not _sync_status["running"]:
        return {"status": "not_running", "message": "Scraper is not running"}

    _stop_event.set()
    _sync_status["message"] = "Stop requested — finishing current page…"
    return {"status": "stopping", "message": "Stop signal sent"}


@router.get("/sync/status")
def sync_status_endpoint():
    """Return current scraper status (poll this every few seconds)."""
    return _sync_status


@router.get("/stats")
def google_stats(db: Session = Depends(get_db)):
    today = date.today()

    total_all = db.query(func.count(GoogleResult.id))\
                  .filter(GoogleResult.result_type == "all").scalar() or 0
    total_filtered = db.query(func.count(GoogleResult.id))\
                       .filter(GoogleResult.result_type == "filtered").scalar() or 0

    today_all = db.query(func.count(GoogleResult.id))\
                   .filter(GoogleResult.result_type == "all",
                           cast(GoogleResult.scraped_at, Date) == today).scalar() or 0
    today_filtered = db.query(func.count(GoogleResult.id))\
                        .filter(GoogleResult.result_type == "filtered",
                                cast(GoogleResult.scraped_at, Date) == today).scalar() or 0
    last_sync = db.query(func.max(GoogleResult.scraped_at)).scalar()

    return {
        "total_all":      total_all,
        "total_filtered": total_filtered,
        "today_all":      today_all,
        "today_filtered": today_filtered,
        "last_sync":      last_sync.isoformat() if last_sync else None,
        "sync_status":    _sync_status,
    }


@router.get("/results")
def google_results(
    result_type: str = Query("all"),
    date_from:   Optional[str] = Query(None),
    date_to:     Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(GoogleResult).filter(GoogleResult.result_type == result_type)

    if date_from:
        try:
            q = q.filter(GoogleResult.scraped_at >= datetime.strptime(date_from, "%Y-%m-%d"))
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            q = q.filter(GoogleResult.scraped_at <= dt)
        except ValueError:
            pass

    rows = q.order_by(GoogleResult.scraped_at.desc()).all()

    groups: dict = {}
    for row in rows:
        dk = row.scraped_at.date().isoformat() if row.scraped_at else "unknown"
        if dk not in groups:
            groups[dk] = []
        groups[dk].append(row.to_dict())

    return {"result_type": result_type, "total": len(rows), "groups": groups}


@router.get("/export/{result_type}")
def export_google(
    result_type: str,
    date_from:   Optional[str] = Query(None),
    date_to:     Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if result_type not in ("all", "filtered"):
        return JSONResponse({"detail": "result_type must be 'all' or 'filtered'"}, 422)

    try:
        import pandas as pd
    except ImportError:
        return JSONResponse({"detail": "pandas not installed"}, 500)

    q = db.query(GoogleResult).filter(GoogleResult.result_type == result_type)
    if date_from:
        try:
            q = q.filter(GoogleResult.scraped_at >= datetime.strptime(date_from, "%Y-%m-%d"))
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            q = q.filter(GoogleResult.scraped_at <= dt)
        except ValueError:
            pass

    rows = q.order_by(GoogleResult.scraped_at.desc()).all()
    if not rows:
        return JSONResponse({"detail": "No data to export"}, 404)

    data = []
    for r in rows:
        d = r.to_dict()
        d["keywords"] = ", ".join(d["keywords"]) if isinstance(d["keywords"], list) else d["keywords"]
        data.append(d)

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        df.to_excel(writer, index=False, sheet_name=f"Google_{result_type}")
    output.seek(0)

    filename = f"google_{result_type}_{date.today()}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
