from app.database import SessionLocal
from app.models import EmailLog

def check_logs():
    db = SessionLocal()
    try:
        latest_logs = db.query(EmailLog).order_by(EmailLog.sent_at.desc()).limit(5).all()
        for log in latest_logs:
            print(f"To: {log.recipient} | Status: {log.status} | Error: {log.error_message}")
    finally:
        db.close()

if __name__ == "__main__":
    check_logs()
