import json
import logging
import requests
import threading
import time
from datetime import datetime, time as dt_time, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app.models import Tender, EmailRecipient, EmailLog, EmailSetting

logger = logging.getLogger("email_service")

class EmailService:
    @staticmethod
    def send_email(to: str, subject: str, html_content: str, from_email: Optional[str] = None, from_name: Optional[str] = None) -> bool:
        """Sends an email using Resend API (via requests)."""
        if not settings.RESEND_API_KEY:
            logger.warning("RESEND_API_KEY not set. Skipping email to %s", to)
            return False

        # Use provided from_email/from_name or fallback to system defaults
        final_from_email = from_email or settings.EMAIL_FROM
        final_from_name = from_name or "Tender Intelligence"
        
        # Format as "Name <email@domain.com>"
        sender_formatted = f"{final_from_name} <{final_from_email}>"

        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": sender_formatted,
            "to": to,
            "subject": subject,
            "html": html_content,
            "reply_to": settings.EMAIL_REPLY_TO
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=15)
            if response.status_code in (200, 201):
                logger.info("Email sent successfully to %s", to)
                return True
            else:
                err_msg = f"API Error ({response.status_code}): {response.text}"
                logger.error("Failed to send email to %s: %s", to, err_msg)
                return False, err_msg
        except Exception as e:
            err_msg = str(e)
            logger.exception("Error sending email via Resend: %s", err_msg)
            return False, err_msg

    @staticmethod
    def log_email(db: Session, recipient: str, subject: str, status: str, error_message: Optional[str] = None):
        """Logs an email attempt in the database."""
        log = EmailLog(
            recipient=recipient,
            subject=subject,
            status=status,
            error_message=error_message
        )
        db.add(log)
        db.commit()

    @staticmethod
    def generate_tender_report_html(tenders: List[Tender]) -> str:
        """Generates a compact HTML template matching the user's design."""
        date_str = datetime.now().strftime("%d %b %Y")
        
        rows_html = ""
        for t in tenders:
            rows_html += f"""
            <div style="margin-bottom: 25px;">
                <p style="margin: 0 0 5px 0;"><strong>Tender ID:</strong> {t.tender_id or 'N/A'}</p>
                <p style="margin: 0 0 5px 0;"><strong>Description:</strong> {t.description or t.title or 'No description'}</p>
                <p style="margin: 0 0 5px 0;"><strong>Keyword:</strong> {t.keyword or 'N/A'} | <strong>Source:</strong> {t.source.upper()}</p>
                <p style="margin: 0 0 5px 0;"><strong>Start Date:</strong> {t.start_date or 'N/A'} | <strong>End Date:</strong> {t.end_date or 'N/A'}</p>
                <p style="margin: 0 0 15px 0;"><strong>Link:</strong> <a href="{t.link or '#'}" style="color: #1a73e8; text-decoration: none;">{t.link or '#'}</a></p>
                <hr style="border: 0; border-top: 1px solid #000000; margin: 0;">
            </div>
            """

        if not rows_html:
            rows_html = "<p style='text-align: center; color: #888888; padding: 20px;'>No new tenders found for this period.</p>"

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.5; color: #000000; margin: 0; padding: 20px; }}
            </style>
        </head>
        <body>
            <p>Dear Team,</p>
            <p>Please find below the consolidated tender report as of {date_str}.</p>
            <br>
            <hr style="border: 0; border-top: 1px solid #000000; margin: 0 0 20px 0;">
            
            {rows_html}
            
            <p style="font-size: 11px; color: #888888; margin-top: 40px;">
                &copy; {datetime.now().year} Leonex Tender Intelligence Platform. Automated Report.
            </p>
        </body>
        </html>
        """

    @classmethod
    def send_daily_report(cls, db: Session, manual_recipient: Optional[str] = None):
        """Fetches tenders and sends report to recipients."""
        logger.info("Starting tender report generation...")
        
        # 1. Fetch settings
        settings_row = db.query(EmailSetting).first()
        if not settings_row:
            settings_row = EmailSetting()
            db.add(settings_row)
            db.commit()
            db.refresh(settings_row)

        if not manual_recipient and not settings_row.daily_report_enabled:
            logger.info("Daily report is disabled in settings.")
            return

        # 2. Identify Time Range
        # For manual triggers, we look back 48 hours to ensure past results (like the 11th) are captured.
        # For scheduled ones, we look back 24 hours.
        lookback_hours = 48 if manual_recipient or not settings_row.last_report_sent_at else 24
        start_time = datetime.now() - timedelta(hours=lookback_hours)
        
        tenders = db.query(Tender).filter(Tender.created_at >= start_time).order_by(Tender.created_at.desc()).all()
        
        # 3. Generate HTML
        html_content = cls.generate_tender_report_html(tenders)
        subject = f"Tender Report – {datetime.now().strftime('%d %b %Y')}"

        # 4. Identify recipients
        if manual_recipient:
            logger.info("Sending manual report to %s", manual_recipient)
            # Create a transient recipient object for the loop
            recipients = [EmailRecipient(email=manual_recipient, name="Subscriber", is_active=True)]
        else:
            recipients = db.query(EmailRecipient).filter(EmailRecipient.is_active == True).all()
            logger.info("Sending scheduled report to %d active recipients", len(recipients))

        # 5. Send emails
        from_email = settings_row.sender_email
        from_name = settings_row.sender_name

        for r in recipients:
            result = cls.send_email(r.email, subject, html_content, from_email=from_email, from_name=from_name)
            
            if isinstance(result, tuple):
                success, err = result
            else:
                success = result
                err = None if success else "Unknown API Error"
                
            cls.log_email(db, r.email, subject, "sent" if success else "failed", err)

        # 6. Update last sent time if not manual
        if not manual_recipient:
            settings_row.last_report_sent_at = datetime.now()
            db.commit()

class EmailScheduler:
    """Simple background thread scheduler for daily reports."""
    @staticmethod
    def start():
        def run():
            logger.info("Email Scheduler thread started.")
            while True:
                try:
                    db = SessionLocal()
                    try:
                        settings_row = db.query(EmailSetting).first()
                        if settings_row and settings_row.daily_report_enabled:
                            target_time_str = settings_row.report_time
                            try:
                                hour, minute = map(int, target_time_str.split(':'))
                                now = datetime.now()
                                target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                                
                                # If target time already passed today, check if we sent it
                                last_sent = settings_row.last_report_sent_at
                                if last_sent:
                                    sent_today = last_sent.date() == now.date()
                                else:
                                    sent_today = False

                                if not sent_today and now >= target_time:
                                    EmailService.send_daily_report(db)
                            except Exception as e:
                                logger.error("Scheduler time parsing error (%s): %s", target_time_str, e)
                    finally:
                        db.close()
                except Exception as e:
                    logger.error("Scheduler loop error: %s", e)
                
                time.sleep(60)

        t = threading.Thread(target=run, daemon=True, name="email-scheduler")
        t.start()
