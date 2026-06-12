import logging
import smtplib
import threading
import time
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app.models import Tender, EmailRecipient, EmailLog, EmailSetting

logger = logging.getLogger("email_service")

class EmailService:
    @staticmethod
    def send_email(to: str, subject: str, html_content: str, from_email: Optional[str] = None, from_name: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """Sends an email using standard SMTP (Nodemailer equivalent). Returns (success, error_message)."""
        
        # 1. Validation
        if not settings.SMTP_USER or not settings.SMTP_PASS:
            msg = "SMTP_USER or SMTP_PASS is missing from environment."
            logger.warning(msg)
            return False, msg

        # 2. Construct Message
        final_from_email = from_email or settings.EMAIL_FROM
        final_from_name = from_name or "Tender Intelligence"
        
        # Standardize "Name <email@domain.com>"
        if "<" not in final_from_email:
            sender_formatted = f"{final_from_name} <{final_from_email}>"
        else:
            sender_formatted = final_from_email

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender_formatted
        msg["To"] = to
        
        if settings.EMAIL_REPLY_TO:
            msg["Reply-To"] = settings.EMAIL_REPLY_TO

        # Attach HTML part
        msg.attach(MIMEText(html_content, "html"))

        # 3. Transmission
        try:
            # Use SMTP_PORT (usually 587 for TLS or 465 for SSL)
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20)
            
            if settings.SMTP_TLS:
                server.starttls()  # Upgrade to secure connection
                
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)
            server.quit()
            
            logger.info("Email sent successfully to %s via SMTP", to)
            return True, None

        except smtplib.SMTPAuthenticationError:
            err = "Authentication Failed: Check SMTP_USER and SMTP_PASS (or App Password)."
            logger.error(err)
            return False, err
        except smtplib.SMTPConnectError:
            err = f"Connection Failed: Could not reach {settings.SMTP_HOST} on port {settings.SMTP_PORT}."
            logger.error(err)
            return False, err
        except Exception as e:
            err = f"SMTP Error: {str(e)}"
            logger.exception(err)
            return False, err

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
                <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Description:</strong> {t.description or t.title or 'No description'}</p>
                <p style="margin: 0 0 5px 0; font-size: 12px; color: #555;"><strong>Keyword:</strong> {t.keyword or 'N/A'} | <strong>Source:</strong> {t.source.upper()}</p>
                <p style="margin: 0 0 5px 0; font-size: 12px; color: #555;"><strong>Start Date:</strong> {t.start_date or 'N/A'} | <strong>End Date:</strong> {t.end_date or 'N/A'}</p>
                <p style="margin: 0 0 15px 0; font-size: 12px;"><strong>Link:</strong> <a href="{t.link or '#'}" style="color: #000; text-decoration: underline;">{t.link or '#'}</a></p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 0;">
            </div>
            """
        if not rows_html:
            rows_html = "<p style='text-align: center; color: #888; padding: 40px;'>No new tenders found for this period.</p>"

        return f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #000; margin: 0; padding: 40px; background: #fff;">
            <div style="max-width: 600px; margin: 0 auto;">
                <div style="border-left: 4px solid #000; padding-left: 20px; margin-bottom: 40px;">
                    <p style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #888; margin: 0;">Automated Distribution</p>
                    <h2 style="font-size: 28px; font-weight: 900; margin: 5px 0 0 0; letter-spacing: -0.5px;">Tender Intelligence Report</h2>
                </div>
                <p>Hello Team,</p>
                <p>Please find the consolidated tender collection for <strong>{date_str}</strong> below.</p>
                <div style="margin-top: 40px;">{rows_html}</div>
                <p style="font-size: 11px; color: #aaa; margin-top: 60px; text-align: center;">Authorized by Leonex Tender Intelligence Platform.</p>
            </div>
        </body>
        </html>
        """

    @classmethod
    def send_daily_report(cls, db: Session, manual_recipient: Optional[str] = None, target_date: Optional[str] = None):
        """Fetches tenders and sends report to recipients. If target_date provided, filters by that date."""
        settings_row = db.query(EmailSetting).first()
        if not settings_row:
            settings_row = EmailSetting()
            db.add(settings_row); db.commit(); db.refresh(settings_row)

        if not manual_recipient and not target_date and not settings_row.daily_report_enabled:
            return

        if target_date:
            try:
                dt = datetime.strptime(target_date, "%Y-%m-%d")
                start_time = dt.replace(hour=0, minute=0, second=0, microsecond=0)
                end_time = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
                date_str = dt.strftime("%B %d, %Y")
            except ValueError:
                # Fallback to default if invalid date string
                start_time = datetime.now() - timedelta(hours=48)
                end_time = datetime.now()
                date_str = datetime.now().strftime("%B %d, %Y")
        else:
            lookback_hours = 48 if manual_recipient or not settings_row.last_report_sent_at else 24
            start_time = datetime.now() - timedelta(hours=lookback_hours)
            end_time = datetime.now()
            date_str = datetime.now().strftime("%B %d, %Y")

        tenders = db.query(Tender).filter(Tender.created_at >= start_time, Tender.created_at <= end_time).order_by(Tender.created_at.desc()).all()
        
        html_content = cls.generate_tender_report_html(tenders)
        subject = f"Tender Intelligence Report – {datetime.now().strftime('%d %b %Y')}"

        if manual_recipient:
            recipients = [EmailRecipient(email=manual_recipient, name="Subscriber", is_active=True)]
        else:
            recipients = db.query(EmailRecipient).filter(EmailRecipient.is_active == True).all()

        from_email = settings_row.sender_email
        from_name = settings_row.sender_name

        for r in recipients:
            success, err = cls.send_email(r.email, subject, html_content, from_email=from_email, from_name=from_name)
            cls.log_email(db, r.email, subject, "sent" if success else "failed", err)

        if not manual_recipient:
            settings_row.last_report_sent_at = datetime.now()
            db.commit()

class EmailScheduler:
    @staticmethod
    def start():
        def run():
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
                                last_sent = settings_row.last_report_sent_at
                                sent_today = last_sent and last_sent.date() == now.date()
                                if not sent_today and now >= target_time:
                                    EmailService.send_daily_report(db)
                            except: pass
                    finally:
                        db.close()
                except: pass
                time.sleep(60)

        t = threading.Thread(target=run, daemon=True, name="email-scheduler")
        t.start()
