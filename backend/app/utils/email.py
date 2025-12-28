import logging
import re
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _is_valid_email(email: str) -> bool:
    return bool(email and _EMAIL_RE.match(email))


def _build_welcome_email_html() -> str:
    try:
        from pathlib import Path
        template_path = Path(__file__).parent.parent / "templates" / "welcome_email.html"
        return template_path.read_text(encoding="utf-8")
    except Exception as e:
        logger.error(f"Failed to load email template: {e}")
        # Fallback to simple HTML if template fails
        return """
        <html><body>
            <h2>Welcome to MeetMate</h2>
            <p>Admin has updated the template but it failed to load. Please contact support.</p>
        </body></html>
        """


def _build_welcome_email_text() -> str:
    return (
        "Xin chào,\n\n"
        "Cảm ơn bạn đã đăng ký nhận thông tin từ MeetMate — trợ lý AI hỗ trợ chuẩn hóa quy trình họp "
        "và chuyển kết quả cuộc họp thành hành động có trách nhiệm.\n\n"
        "MeetMate giúp bạn:\n"
        "- Pre-meeting: chuẩn bị agenda, tài liệu, nhắc lịch theo ngữ cảnh.\n"
        "- In-meeting: ghi nhận nội dung theo thời gian thực, phân tách người nói.\n"
        "- Post-meeting: tạo minutes có cấu trúc, trích xuất Action Items/Decisions, gửi và đồng bộ sang công cụ quản trị.\n\n"
        "Tài liệu & liên kết:\n"
        "- Giới thiệu: https://vnpt-ai-hackathon-meetmate.vercel.app/about\n"
        "- Demo (sắp ra mắt): https://vnpt-ai-hackathon-meetmate.vercel.app/demo\n"
        "- Website: https://vnpt-ai-hackathon-meetmate.vercel.app/\n\n"
        "Nếu bạn muốn team demo theo quy trình thực tế của đội mình, hãy reply email này và cho biết ngữ cảnh sử dụng.\n\n"
        "Trân trọng,\n"
        "MeetMate Team\n"
    )


def send_welcome_email(to_email: str, *, subject: Optional[str] = None) -> bool:
    """
    Send a welcome email to a subscriber.

    Returns:
        True if sent successfully, False otherwise.

    Notes:
        - Uses SMTP settings from `get_settings()`.
        - Designed to run in a background task (but safe to call synchronously).
    """
    if not settings.email_enabled:
        logger.info("Email sending is disabled. Skipping welcome email.")
        return False

    if not _is_valid_email(to_email):
        logger.warning("Invalid email address: %r. Skipping welcome email.", to_email)
        return False

    subj = subject or "Chào mừng bạn đến với MeetMate"

    from_addr = settings.smtp_user
    from_name = getattr(settings, "email_from_name", None) or "MeetMate"
    reply_to = getattr(settings, "email_reply_to", None)  # optional in settings

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{from_name} <{from_addr}>"
    msg["To"] = to_email
    msg["Subject"] = subj
    if reply_to:
        msg["Reply-To"] = reply_to

    text_part = MIMEText(_build_welcome_email_text(), "plain", "utf-8")
    html_part = MIMEText(_build_welcome_email_html(), "html", "utf-8")
    msg.attach(text_part)
    msg.attach(html_part)

    timeout = getattr(settings, "smtp_timeout_sec", 15)
    use_starttls = getattr(settings, "smtp_starttls", True)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=timeout) as server:
            server.ehlo()

            if use_starttls:
                context = ssl.create_default_context()
                server.starttls(context=context)
                server.ehlo()

            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)

        logger.info("Welcome email sent to %s", to_email)
        return True

    except Exception:
        logger.exception("Failed to send welcome email to %s", to_email)
        return False
