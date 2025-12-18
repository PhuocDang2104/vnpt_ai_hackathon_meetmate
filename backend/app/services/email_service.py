"""
Email Service - Send emails via SMTP (Gmail)
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from email.utils import formataddr, make_msgid
from email.header import Header
from typing import Optional, List
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def is_email_enabled() -> bool:
    """Check if email sending is configured"""
    return (
        settings.email_enabled and 
        bool(settings.smtp_user) and 
        bool(settings.smtp_password)
    )


def send_email(
    to_emails: List[str],
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
    attachment_content: Optional[bytes] = None,
    attachment_filename: Optional[str] = None,
) -> dict:
    """
    Send email via SMTP
    
    Args:
        to_emails: List of recipient email addresses
        subject: Email subject
        body_text: Plain text body
        body_html: HTML body (optional)
        attachment_content: File content as bytes (optional)
        attachment_filename: Attachment filename (optional)
    
    Returns:
        dict with status and details
    """
    if not is_email_enabled():
        logger.warning("Email sending is not enabled. Set SMTP credentials and EMAIL_ENABLED=true")
        return {
            'success': False,
            'error': 'Email not configured',
            'sent_to': [],
            'failed': to_emails
        }
    
    try:
        # Create message (UTF-8 safe headers)
        msg = MIMEMultipart('alternative')
        from_name = settings.email_from_name or settings.smtp_user
        msg['From'] = formataddr((str(Header(from_name, 'utf-8')), settings.smtp_user))
        msg['To'] = ', '.join(to_emails)
        msg['Subject'] = str(Header(subject, 'utf-8'))
        msg['Message-ID'] = make_msgid()
        
        # Add text body
        msg.attach(MIMEText(body_text, 'plain', 'utf-8'))
        
        # Add HTML body if provided
        if body_html:
            msg.attach(MIMEText(body_html, 'html', 'utf-8'))
        
        # Add attachment if provided
        if attachment_content and attachment_filename:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment_content)
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename="{attachment_filename}"'
            )
            msg.attach(part)
        
        # Send email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, to_emails, msg.as_string())
        
        logger.info(f"Email sent successfully to {len(to_emails)} recipients")
        return {
            'success': True,
            'sent_to': to_emails,
            'failed': []
        }
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed: {e}")
        return {
            'success': False,
            'error': 'SMTP authentication failed. Check email/password.',
            'sent_to': [],
            'failed': to_emails
        }
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {e}")
        return {
            'success': False,
            'error': f'SMTP error: {str(e)}',
            'sent_to': [],
            'failed': to_emails
        }
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return {
            'success': False,
            'error': str(e),
            'sent_to': [],
            'failed': to_emails
        }


def send_meeting_minutes_email(
    to_emails: List[str],
    meeting_title: str,
    meeting_date: str,
    meeting_time: str,
    meeting_location: str,
    executive_summary: str,
    minutes_content: Optional[str] = None,
) -> dict:
    """
    Send meeting minutes email with formatted content
    """
    subject = f"[MeetMate] Biên bản cuộc họp: {meeting_title} - {meeting_date}"
    
    body_text = f"""Kính gửi Quý đồng nghiệp,

Biên bản cuộc họp "{meeting_title}" đã được hoàn thành.

📅 Thời gian: {meeting_date} - {meeting_time}
📍 Địa điểm: {meeting_location}

📋 TÓM TẮT:
{executive_summary}

---
Đây là email tự động từ MeetMate AI Assistant.
Vui lòng không trả lời email này.
"""

    body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #5b5fc7, #7b7fd7); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .header h1 {{ margin: 0; font-size: 20px; }}
        .content {{ background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }}
        .meta {{ display: flex; gap: 20px; margin-bottom: 20px; }}
        .meta-item {{ display: flex; align-items: center; gap: 8px; font-size: 14px; color: #666; }}
        .summary {{ background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #5b5fc7; }}
        .summary h3 {{ margin-top: 0; color: #5b5fc7; }}
        .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #999; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Biên bản cuộc họp</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">{meeting_title}</p>
        </div>
        <div class="content">
            <div class="meta">
                <div class="meta-item">📅 {meeting_date}</div>
                <div class="meta-item">🕐 {meeting_time}</div>
                <div class="meta-item">📍 {meeting_location}</div>
            </div>
            <div class="summary">
                <h3>Tóm tắt cuộc họp</h3>
                <p>{executive_summary.replace(chr(10), '<br>')}</p>
            </div>
        </div>
        <div class="footer">
            <p>Đây là email tự động từ <strong>MeetMate AI Assistant</strong></p>
            <p>Vui lòng không trả lời email này.</p>
        </div>
    </div>
</body>
</html>
"""

    return send_email(
        to_emails=to_emails,
        subject=subject,
        body_text=body_text,
        body_html=body_html,
    )


# Test function
def test_email_config() -> dict:
    """Test email configuration by sending a test email"""
    if not is_email_enabled():
        return {
            'success': False,
            'message': 'Email not configured. Set SMTP_USER, SMTP_PASSWORD, EMAIL_ENABLED=true'
        }
    
    try:
        result = send_email(
            to_emails=[settings.smtp_user],
            subject='[MeetMate] Test Email',
            body_text='This is a test email from MeetMate. Email configuration is working!',
        )
        return result
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
