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
    # Keep inline CSS simple (better compatibility across email clients)
    return """
    <div style="position: relative; width: 100%; height: 0; padding-top: 100.0000%;
 padding-bottom: 0; box-shadow: 0 2px 8px 0 rgba(63,69,81,0.16); margin-top: 1.6em; margin-bottom: 0.9em; overflow: hidden;
 border-radius: 8px; will-change: transform;">
  <iframe loading="lazy" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none; padding: 0;margin: 0;"
    src="https://www.canva.com/design/DAG8ofsui9Q/QCQuWNfXhicYEA2NNMz6jA/view?embed" allowfullscreen="allowfullscreen" allow="fullscreen">
  </iframe>
</div>
<a href="https:&#x2F;&#x2F;www.canva.com&#x2F;design&#x2F;DAG8ofsui9Q&#x2F;QCQuWNfXhicYEA2NNMz6jA&#x2F;view?utm_content=DAG8ofsui9Q&amp;utm_campaign=designshare&amp;utm_medium=embeds&amp;utm_source=link" target="_blank" rel="noopener">Software &amp; SaaS B2B Email in Dark Blue Black and White Purple Modern &amp; Futuristic Style</a> của Quan Hoang
    """
#     return """\
# <!DOCTYPE html>
# <html lang="vi">
# <head>
#   <meta charset="utf-8" />
#   <meta name="viewport" content="width=device-width,initial-scale=1" />
#   <title>Welcome to MeetMate</title>
# </head>
# <body style="margin:0;padding:0;background:#ffffff;color:#1f2937;">
#   <div style="max-width:600px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;line-height:1.6;">
#     <div style="padding:16px 18px;border:1px solid #e5e7eb;border-radius:12px;">
#       <h2 style="margin:0 0 10px 0;font-size:20px;">Cảm ơn bạn đã quan tâm đến MeetMate</h2>
#       <p style="margin:0 0 14px 0;">
#         Xin chào,<br/>
#         Cảm ơn bạn đã đăng ký nhận thông tin từ <strong>MeetMate</strong> — trợ lý AI hỗ trợ chuẩn hóa quy trình họp và chuyển kết quả cuộc họp thành hành động có trách nhiệm.
#       </p>

#       <h3 style="margin:18px 0 8px 0;font-size:16px;">MeetMate giúp bạn làm gì?</h3>
#       <ul style="margin:0 0 14px 18px;padding:0;">
#         <li style="margin:0 0 8px 0;"><strong>Pre-meeting:</strong> chuẩn bị agenda, tài liệu, nhắc lịch theo ngữ cảnh.</li>
#         <li style="margin:0 0 8px 0;"><strong>In-meeting:</strong> ghi nhận nội dung theo thời gian thực, phân tách người nói.</li>
#         <li style="margin:0 0 8px 0;"><strong>Post-meeting:</strong> tạo minutes có cấu trúc, trích xuất <em>Action Items</em>/<em>Decisions</em>, gửi và đồng bộ sang công cụ quản trị.</li>
#       </ul>

#       <h3 style="margin:18px 0 8px 0;font-size:16px;">Tài liệu & liên kết</h3>
#       <ul style="margin:0 0 16px 18px;padding:0;">
#         <li style="margin:0 0 8px 0;">
#           Giới thiệu sản phẩm: <a href="https://vnpt-ai-hackathon-meetmate.vercel.app/about" style="color:#2563eb;text-decoration:none;">/about</a>
#         </li>
#         <li style="margin:0 0 8px 0;">
#           Demo (sắp ra mắt): <a href="https://vnpt-ai-hackathon-meetmate.vercel.app" style="color:#2563eb;text-decoration:none;">/demo</a>
#         </li>
#       </ul>

#       <div style="text-align:center;margin:22px 0 8px 0;">
#         <a href="https://vnpt-ai-hackathon-meetmate.vercel.app/"
#            style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;
#                   padding:12px 18px;border-radius:10px;font-weight:700;">
#           Truy cập website
#         </a>
#       </div>

#       <p style="margin:16px 0 0 0;">
#         Nếu anh/chị muốn tụi em demo theo quy trình thực tế của đội mình (agenda, tài liệu, action-items), hãy reply email này và cho biết ngữ cảnh sử dụng.
#       </p>

#       <p style="margin:16px 0 0 0;">
#         Trân trọng,<br/>
#         <strong>MeetMate Team</strong>
#       </p>
#     </div>

#     <p style="margin:14px 0 0 0;font-size:12px;color:#6b7280;text-align:center;">
#       Email này được gửi tự động từ MeetMate.
#     </p>
#   </div>
# </body>
# </html>
# """


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
