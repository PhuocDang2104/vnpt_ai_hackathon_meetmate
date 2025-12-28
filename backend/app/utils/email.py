
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

def send_welcome_email(to_email: str):
    """
    Sends a welcome email to the subscriber using SMTP credentials from settings.
    This function is designed to be run in a background task.
    """
    if not settings.email_enabled:
        logger.warning("Email sending is disabled in settings. Skipping welcome email.")
        return

    subject = "Chào mừng bạn đến với MeetMate AI - Giải pháp Kiến tạo Tương lai Cuộc họp"
    
    # HTML Content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }}
            .header {{ text-align: center; background-color: #f8f9fa; padding: 20px; border-radius: 10px 10px 0 0; }}
            .logo {{ max-width: 150px; margin-bottom: 10px; }}
            .content {{ padding: 20px; }}
            .cta-button {{ display: inline-block; padding: 12px 24px; background-color: #f7a745; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; }}
            .footer {{ text-align: center; font-size: 0.8em; color: #777; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }}
            ul {{ padding-left: 20px; }}
            li {{ margin-bottom: 8px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Cảm ơn bạn đã quan tâm đến MeetMate!</h2>
            </div>
            
            <div class="content">
                <p>Xin chào,</p>
                <p>Cảm ơn bạn đã đăng ký nhận thông tin từ <strong>MeetMate</strong> - Trợ lý AI toàn diện cho các cuộc họp doanh nghiệp.</p>
                
                <h3>🔥 Tại sao MeetMate là giải pháp bạn cần?</h3>
                <p>Chúng tôi giúp bạn tự động hóa quy trình họp từ A-Z:</p>
                <ul>
                    <li><strong>Pre-meeting:</strong> Tự động chuẩn bị tài liệu, agenda và nhắc nhở.</li>
                    <li><strong>In-meeting:</strong> Ghi chép biên bản (Meeting Minutes) thời gian thực, nhận diện người nói.</li>
                    <li><strong>Post-meeting:</strong> Tự động trích xuất Action Items, Decisions và gửi báo cáo qua Email/Jira.</li>
                </ul>

                <h3>🚀 Tài liệu & Link hữu ích</h3>
                <p>Dưới đây là các tài liệu chi tiết về sản phẩm và Proposal của chúng tôi:</p>
                <ul>
                    <li><a href="https://vnpt-ai-hackathon-meetmate.vercel.app/about">Xem giới thiệu chi tiết</a></li>
                    <li><a href="https://vnpt-ai-hackathon-meetmate.vercel.app/demo">Trải nghiệm Demo (Sắp ra mắt)</a></li>
                </ul>

                <p style="text-align: center; margin-top: 30px;">
                    <a href="https://vnpt-ai-hackathon-meetmate.vercel.app/" class="cta-button" style="color: #fff;">Truy cập Website ngay</a>
                </p>
                
                <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại reply email này. Đội ngũ MeetMate luôn sẵn sàng hỗ trợ!</p>
                
                <p>Trân trọng,<br><strong>Đội ngũ MeetMate</strong></p>
            </div>
            
            <div class="footer">
                <p>&copy; 2024 MeetMate AI. All rights reserved.</p>
                <p>Đây là email tự động, vui lòng không trả lời vào hòm thư no-reply (nếu có).</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        msg = MIMEMultipart()
        msg['From'] = f"{settings.email_from_name} <{settings.smtp_user}>"
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(html_content, 'html'))

        # Connect to SMTP Server
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Welcome email sent successfully to {to_email}")
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {to_email}: {str(e)}")
