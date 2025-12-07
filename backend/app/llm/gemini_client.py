"""
Google Gemini AI Client
Handles all AI interactions using Google's Gemini API
"""
import google.generativeai as genai
from typing import Optional, List, Dict, Any
from app.core.config import get_settings

settings = get_settings()


def get_gemini_client():
    """Initialize and return Gemini client"""
    if not settings.gemini_api_key:
        return None
    
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(settings.gemini_model)


def is_gemini_available() -> bool:
    """Check if Gemini API is configured and working"""
    if not settings.gemini_api_key or settings.gemini_api_key == '':
        print("[Gemini] No API key configured")
        return False
    try:
        genai.configure(api_key=settings.gemini_api_key)
        # Try a simple test call
        model = genai.GenerativeModel(settings.gemini_model)
        response = model.generate_content("test", generation_config=genai.types.GenerationConfig(max_output_tokens=10))
        print(f"[Gemini] API working with model: {settings.gemini_model}")
        return True
    except Exception as e:
        print(f"[Gemini] API error: {e}")
        return False


class GeminiChat:
    """Gemini Chat Session Manager"""
    
    def __init__(self, system_prompt: Optional[str] = None):
        self.model = get_gemini_client()
        self.system_prompt = system_prompt or self._default_system_prompt()
        self.history: List[Dict[str, str]] = []
    
    def _default_system_prompt(self) -> str:
        return """Bạn là MeetMate AI Assistant - trợ lý thông minh cho PMO (Project Management Office) của ngân hàng LPBank.

Nhiệm vụ của bạn:
1. Hỗ trợ chuẩn bị cuộc họp (Pre-meeting): Gợi ý agenda, tài liệu, người tham gia
2. Hỗ trợ trong cuộc họp (In-meeting): Ghi chép, phát hiện action items, decisions, risks
3. Hỗ trợ sau cuộc họp (Post-meeting): Tạo biên bản, theo dõi tasks, Q&A

QUAN TRỌNG - Nguyên tắc trả lời:
- Trả lời bằng tiếng Việt, ngắn gọn, chuyên nghiệp, trực tiếp
- KHÔNG sử dụng markdown (không dùng **, ##, hay bất kỳ ký tự markdown nào)
- KHÔNG chào hỏi mỗi lần trả lời (chỉ trả lời trực tiếp câu hỏi)
- Trả lời bằng văn bản thuần túy, dễ đọc
- Nếu được hỏi về policy/quy định, trích dẫn nguồn cụ thể
- Nếu không chắc chắn, nói rõ "Tôi không có thông tin về điều này"
- Với câu hỏi về dự án, tham chiếu các tài liệu nội bộ

Bạn có kiến thức về:
- Các dự án CNTT của LPBank (Core Banking, Mobile Banking, LOS, KYC)
- Quy trình PMO, SCRUM, Agile
- Compliance và regulations (NHNN Circular 09/2020, security policies)
- Microsoft Teams, Jira, Planner integration"""

    async def chat(self, message: str, context: Optional[str] = None) -> str:
        """Send a message and get response"""
        if not self.model:
            return self._mock_response(message)
        
        try:
            # Build prompt with context
            full_prompt = self.system_prompt
            
            if context:
                full_prompt += f"\n\nContext cuộc họp:\n{context}"
            
            # Add history
            if self.history:
                full_prompt += "\n\nLịch sử hội thoại:"
                for h in self.history[-5:]:  # Last 5 messages
                    full_prompt += f"\nUser: {h['user']}\nAssistant: {h['assistant']}"
            
            full_prompt += f"\n\nUser: {message}\nAssistant:"
            
            # Generate response
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=settings.ai_temperature,
                    max_output_tokens=settings.ai_max_tokens,
                )
            )
            
            assistant_message = response.text
            
            # Clean markdown from response
            assistant_message = self._clean_markdown(assistant_message)
            
            # Save to history
            self.history.append({
                'user': message,
                'assistant': assistant_message
            })
            
            return assistant_message
            
        except Exception as e:
            import traceback
            print(f"[Gemini] Chat error: {e}")
            print(f"[Gemini] Traceback: {traceback.format_exc()}")
            return self._mock_response(message)
    
    def _clean_markdown(self, text: str) -> str:
        """Remove markdown formatting from text"""
        import re
        # Remove bold **text**
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
        # Remove italic *text*
        text = re.sub(r'\*(.*?)\*', r'\1', text)
        # Remove headers # ## ###
        text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
        # Remove code blocks ```
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
        # Remove inline code `code`
        text = re.sub(r'`([^`]+)`', r'\1', text)
        # Remove links [text](url)
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
        # Clean up multiple spaces
        text = re.sub(r'\s+', ' ', text)
        # Clean up multiple newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()
    
    def _mock_response(self, message: str) -> str:
        """Fallback mock response when API is not available"""
        message_lower = message.lower()
        
        if 'retention' in message_lower or 'lưu trữ' in message_lower:
            return """Theo Thông tư 09/2020/TT-NHNN về quản lý rủi ro CNTT:

Dữ liệu giao dịch (transaction logs): Lưu trữ tối thiểu 10 năm
Dữ liệu khách hàng: Lưu trữ 5 năm sau khi kết thúc quan hệ
Logs hệ thống: Tối thiểu 3 năm

Nguồn: Điều 15, Thông tư 09/2020/TT-NHNN"""

        elif 'security' in message_lower or 'bảo mật' in message_lower:
            return """Theo Security Policy v3.0 của LPBank:

Encryption Requirements:
- Data at rest: AES-256
- Data in transit: TLS 1.3

Access Control:
- Multi-factor authentication (MFA) bắt buộc
- Role-based access control (RBAC)
- Session timeout: 15 phút

Audit:
- Penetration testing: Quarterly
- Security review: Monthly

Nguồn: LPBank Security Policy v3.0, Section 4"""

        elif 'agenda' in message_lower or 'chương trình' in message_lower:
            return """Dựa trên loại cuộc họp, đề xuất chương trình sau:

1. Khai mạc & Điểm danh (5 phút)
- Chủ tịch khai mạc
- Xác nhận quorum

2. Báo cáo tiến độ (15 phút)
- PM trình bày status
- Demo features mới

3. Thảo luận Issues (20 phút)
- Blockers
- Risks

4. Quyết định & Action Items (10 phút)
- Vote các decisions
- Assign owners & deadlines

5. Kết luận (5 phút)

Tổng thời gian: ~55 phút"""

        elif 'risk' in message_lower or 'rủi ro' in message_lower:
            return """Các rủi ro chính cần lưu ý:

Critical:
- Delay go-live Core Banking ảnh hưởng chiến dịch cuối năm

High:
- 3 security issues từ Pentest chưa fix
- Resource shortage trong Q4

Medium:
- Integration với LOS có thể gặp vấn đề performance
- Documentation chưa hoàn thiện

Đề xuất:
1. Escalate resource issue lên Steering
2. Set deadline cứng cho security fixes
3. Thêm performance testing cho integration

Tham khảo: Risk Register Dashboard"""

        else:
            return """Dựa trên knowledge base của MeetMate, tôi có thể hỗ trợ bạn về:

Pre-meeting:
- Tạo agenda tự động
- Gợi ý tài liệu pre-read
- Đề xuất người tham gia

In-meeting:
- Ghi chép real-time
- Phát hiện Action Items, Decisions, Risks
- Hỏi đáp policy/documents

Post-meeting:
- Tạo biên bản tự động
- Sync tasks với Jira/Planner
- Q&A về nội dung cuộc họp

Bạn muốn tôi hỗ trợ điều gì cụ thể?"""


class MeetingAIAssistant:
    """AI Assistant specifically for meeting context"""
    
    def __init__(self, meeting_id: str, meeting_context: Optional[Dict[str, Any]] = None):
        self.meeting_id = meeting_id
        self.meeting_context = meeting_context or {}
        self.chat = GeminiChat()
    
    def _build_context(self) -> str:
        """Build context string from meeting data"""
        ctx_parts = []
        
        if self.meeting_context.get('title'):
            ctx_parts.append(f"Cuộc họp: {self.meeting_context['title']}")
        
        if self.meeting_context.get('type'):
            ctx_parts.append(f"Loại: {self.meeting_context['type']}")
        
        if self.meeting_context.get('project'):
            ctx_parts.append(f"Dự án: {self.meeting_context['project']}")
        
        if self.meeting_context.get('agenda'):
            ctx_parts.append(f"Agenda: {self.meeting_context['agenda']}")
        
        if self.meeting_context.get('transcript'):
            ctx_parts.append(f"Transcript (trích): {self.meeting_context['transcript'][:500]}...")
        
        return "\n".join(ctx_parts)
    
    async def ask(self, question: str) -> str:
        """Ask a question with meeting context"""
        context = self._build_context()
        return await self.chat.chat(question, context)
    
    async def generate_agenda(self, meeting_type: str) -> str:
        """Generate agenda based on meeting type"""
        prompt = f"""Tạo chương trình cuộc họp chi tiết cho loại: {meeting_type}

Yêu cầu:
- Mỗi mục có: số thứ tự, tiêu đề, thời lượng (phút), người trình bày
- Tổng thời gian khoảng 60 phút
- Format: JSON array với fields: order, title, duration_minutes, presenter"""
        
        return await self.chat.chat(prompt)
    
    async def extract_action_items(self, transcript: str) -> str:
        """Extract action items from transcript"""
        prompt = f"""Phân tích transcript sau và trích xuất các Action Items:

{transcript[:2000]}

Format output JSON:
[
  {{
    "description": "Mô tả task",
    "owner": "Tên người được giao (nếu có)",
    "deadline": "Deadline (nếu được đề cập)",
    "priority": "high/medium/low"
  }}
]"""
        
        return await self.chat.chat(prompt)
    
    async def extract_decisions(self, transcript: str) -> str:
        """Extract decisions from transcript"""
        prompt = f"""Phân tích transcript sau và trích xuất các Quyết định (Decisions):

{transcript[:2000]}

Format output JSON:
[
  {{
    "description": "Nội dung quyết định",
    "rationale": "Lý do (nếu có)",
    "confirmed_by": "Người xác nhận"
  }}
]"""
        
        return await self.chat.chat(prompt)
    
    async def extract_risks(self, transcript: str) -> str:
        """Extract risks from transcript"""
        prompt = f"""Phân tích transcript sau và trích xuất các Rủi ro (Risks):

{transcript[:2000]}

Format output JSON:
[
  {{
    "description": "Mô tả rủi ro",
    "severity": "critical/high/medium/low",
    "mitigation": "Biện pháp giảm thiểu (nếu có)"
  }}
]"""
        
        return await self.chat.chat(prompt)
    
    async def generate_summary(self, transcript: str) -> str:
        """Generate meeting summary"""
        prompt = f"""Tạo tóm tắt cuộc họp từ transcript sau:

{transcript[:3000]}

Format:
## Tóm tắt cuộc họp

### Các điểm chính
- ...

### Quyết định
- ...

### Action Items
- ...

### Rủi ro được đề cập
- ...

### Bước tiếp theo
- ..."""
        
        return await self.chat.chat(prompt)

