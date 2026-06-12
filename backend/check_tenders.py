from app.database import SessionLocal
from app.models import Tender
from datetime import datetime, timedelta

def check_tenders():
    db = SessionLocal()
    try:
        june_11 = datetime(2026, 6, 11)
        june_12 = datetime(2026, 6, 12, 23, 59, 59)
        count = db.query(Tender).filter(Tender.created_at >= june_11, Tender.created_at <= june_12).count()
        print(f"Tenders found between June 11 and 12: {count}")
    finally:
        db.close()

if __name__ == "__main__":
    check_tenders()
