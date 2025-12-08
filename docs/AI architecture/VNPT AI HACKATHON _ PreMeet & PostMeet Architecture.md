# Pre-Meeting & Post-Meeting AI Architecture

**MeetMate | Pre-Meeting & Post-Meeting AI Layer**  
**( Preparation Pipeline, Minutes Generation & ADR Extraction )**

---

## **1. Mục tiêu & Phạm vi kiến trúc**

### **1.1. Mục tiêu Pre-Meeting AI**

Trong giai đoạn **Pre-Meeting**, hệ thống AI của MeetMate cần:

* **Tự động sinh Agenda** từ thông tin cuộc họp, lịch sử họp trước, và tài liệu liên quan.
* **Chuẩn bị tài liệu** (Pre-Read Pack):
  * Link tài liệu liên quan từ Knowledge Hub.
  * Tóm tắt các điểm chính từ biên bản họp trước.
* **Thu thập input trước họp**:
  * Câu hỏi cần thảo luận.
  * Rủi ro tiềm ẩn (Risks).
  * Yêu cầu từ thành viên (Requests).
* **Gửi thông báo cuộc họp** với nội dung chuẩn bị đến tất cả thành viên.
* **Hỗ trợ Q&A** về nội dung cuộc họp sắp tới dựa trên RAG.

### **1.2. Mục tiêu Post-Meeting AI**

Trong giai đoạn **Post-Meeting**, hệ thống AI cần:

* **Sinh Executive Summary / Minutes of Meeting** theo chuẩn schema enterprise.
* **Trích xuất và tổng hợp ADR** (Action / Decision / Risk):
  * Loại bỏ trùng lặp (dedupe).
  * Bổ sung thông tin còn thiếu.
  * Gắn nguồn (citations) từ transcript.
* **Phân phối kết quả** qua Email/Teams với format professional.
* **Export PDF** với branding và format chuẩn.
* **Đồng bộ Action Items** sang task management systems (Planner/Jira/LOffice Work).
* **Lưu trữ compliance** với audit trail đầy đủ.

### **1.3. Đảm bảo phi chức năng**

* **Chất lượng cao**: Sử dụng model strong (long-context) cho Pre/Post-Meeting.
* **Bảo mật**: Không rò rỉ PII, mọi action đều được log.
* **Khả năng mở rộng**: Tái sử dụng logic cho các giai đoạn khác.
* **User Experience**: UI responsive, animations mượt, loading states rõ ràng.

---

## **2. Kiến trúc logic Pre-Meeting**

### **2.1. Các thành phần UI**

```
┌─────────────────────────────────────────────────────────────┐
│ [Send Email Action Bar]                        [Gửi Email] │
├─────────────────────────────────┬───────────────────────────┤
│         MAIN COLUMN             │       SIDE COLUMN         │
│                                 │                           │
│  ┌───────────────────────────┐  │  ┌─────────────────────┐  │
│  │ 📅 Agenda Panel           │  │  │ ✅ Prep Status      │  │
│  │  - AI Generate            │  │  │   Agenda ✓  Docs ✓  │  │
│  │  - Inline edit            │  │  │   Participants ✓    │  │
│  │  - Save                   │  │  └─────────────────────┘  │
│  └───────────────────────────┘  │                           │
│                                 │  ┌─────────────────────┐  │
│  ┌───────────────────────────┐  │  │ 👥 Participants     │  │
│  │ 🔔 Reminders Panel        │  │  │  + Add button       │  │
│  │  [❓Hỏi][⚠️Risk][💬YC]    │  │  │  - List view        │  │
│  │  - Add inline             │  │  └─────────────────────┘  │
│  │  - Toggle complete        │  │                           │
│  │  - Priority badges        │  │  ┌─────────────────────┐  │
│  └───────────────────────────┘  │  │ 📄 Documents        │  │
│                                 │  │  Drag & Drop zone   │  │
│                                 │  │  - Upload button    │  │
│                                 │  └─────────────────────┘  │
│                                 │                           │
│                                 │  ┌─────────────────────┐  │
│                                 │  │ ✨ MeetMate AI      │  │
│                                 │  │  Chat with history  │  │
│                                 │  │  - Suggestions      │  │
│                                 │  └─────────────────────┘  │
└─────────────────────────────────┴───────────────────────────┘
```

### **2.2. Component Architecture**

| Component | Chức năng | API Calls |
|-----------|-----------|-----------|
| `SendEmailActionBar` | Hiển thị thông tin meeting, trigger gửi email | - |
| `SendPrepEmailModal` | Modal chọn người nhận, preview & gửi email | `POST /api/v1/meetings/{id}/notify` |
| `AgendaPanel` | Quản lý agenda items với AI generation | `POST /api/v1/agenda/generate`, CRUD `/api/v1/agenda/items` |
| `RemindersPanel` | Tabs Questions/Risks/Requests | `POST /api/v1/reminders` |
| `PrepStatusPanel` | Dashboard chuẩn bị, đếm ngược | - (computed from meeting data) |
| `ParticipantsPanel` | Danh sách & thêm thành viên | `GET /api/v1/users`, `POST /api/v1/meetings/{id}/participants` |
| `DocumentsPanel` | Upload với drag & drop | `POST /api/v1/documents/upload` |
| `AIAssistantPanel` | Chat Q&A về cuộc họp | `POST /api/v1/ai/chat` |

### **2.3. Pre-Meeting Graph (LangGraph)**

```
┌────────────────────────────────────────────────────────────────┐
│                     PRE-MEETING GRAPH                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌──────────────┐                                             │
│   │   START      │                                             │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ▼                                                     │
│   ┌──────────────┐                                             │
│   │ Calendar     │──── Fetch meeting info, history             │
│   │ Ingest Node  │                                             │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ▼                                                     │
│   ┌──────────────┐                                             │
│   │ Pre-Meeting  │──── RAG: policy, docs, prev meetings        │
│   │ RAG Node     │                                             │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ▼                                                     │
│   ┌──────────────┐                                             │
│   │ Agenda       │──── LLM generates structured agenda         │
│   │ Generator    │                                             │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ▼                                                     │
│   ┌──────────────┐                                             │
│   │ Pre-Read     │──── Compile docs & summaries                │
│   │ Compiler     │                                             │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ▼                                                     │
│   ┌──────────────┐                                             │
│   │ Distribution │──── Send email/Teams notifications          │
│   │ Node         │                                             │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ▼                                                     │
│   ┌──────────────┐                                             │
│   │     END      │                                             │
│   └──────────────┘                                             │
└────────────────────────────────────────────────────────────────┘
```

### **2.4. Pre-Meeting State**

```python
class PreMeetingState(TypedDict, total=False):
    # Context
    meeting_id: str
    stage: Literal["pre"]
    
    # Meeting info
    meeting_title: str
    meeting_description: str
    meeting_type: str
    start_time: datetime
    end_time: datetime
    participants: List[Participant]
    
    # Generated content
    agenda_items: List[AgendaItem]
    pre_read_docs: List[DocumentSnippet]
    previous_meetings_summary: str
    
    # Reminders
    questions: List[ReminderItem]
    risks: List[ReminderItem]
    requests: List[ReminderItem]
    
    # RAG
    rag_docs: List[DocumentChunk]
    citations: List[Citation]
    
    # Distribution
    email_sent_to: List[str]
    notification_status: str
    
    # Debug
    debug_info: dict
```

---

## **3. Kiến trúc logic Post-Meeting**

### **3.1. Các thành phần UI**

```
┌─────────────────────────────────────────────────────────────┐
│                    POST-MEETING TAB                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📝 SUMMARY SECTION                                    │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ AI Tạo biên bản                                 │  │  │
│  │  │ [🔄 Generate] [✏️ Edit] [📋 Copy] [📥 Export]    │  │  │
│  │  │                                                 │  │  │
│  │  │ ┌─────────────────────────────────────────────┐ │  │  │
│  │  │ │ # Biên bản cuộc họp: Meeting Title         │ │  │  │
│  │  │ │ **Thời gian:** ...                         │ │  │  │
│  │  │ │ ## Tóm tắt điều hành                       │ │  │  │
│  │  │ │ ...                                        │ │  │  │
│  │  │ └─────────────────────────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📊 STATS ROW                                            ││
│  │  [✅ 5 Actions] [💡 3 Decisions] [⚠️ 2 Risks]           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────┬───────────────────────────────┐│
│  │ ✅ ACTION ITEMS         │ 💡 DECISIONS                  ││
│  │ ┌─────────────────────┐ │ ┌───────────────────────────┐ ││
│  │ │ □ Task 1 - Owner    │ │ │ 1. Decision title        │ ││
│  │ │   Due: 3 days       │ │ │    Rationale: ...        │ ││
│  │ │ □ Task 2 - Owner    │ │ │ 2. Decision title        │ ││
│  │ │   Due: 1 week       │ │ │    Impact: ...           │ ││
│  │ └─────────────────────┘ │ └───────────────────────────┘ ││
│  └─────────────────────────┴───────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⚠️ RISKS                                                ││
│  │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   ││
│  │ │ 🔴 HIGH       │ │ 🟡 MEDIUM     │ │ 🟢 LOW        │   ││
│  │ │ Risk desc... │ │ Risk desc... │ │ Risk desc... │   ││
│  │ └───────────────┘ └───────────────┘ └───────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📤 DISTRIBUTION                                         ││
│  │ [📧 Email biên bản] [📎 Share link] [💾 Export PDF]     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### **3.2. Component Architecture**

| Component | Chức năng | API Calls |
|-----------|-----------|-----------|
| `SummarySection` | Generate/Edit/Export biên bản | `POST /api/v1/minutes/generate`, `PUT /api/v1/minutes/{id}` |
| `StatsSection` | Thống kê ADR counts | Computed from meeting data |
| `ActionItemsSection` | Danh sách & toggle actions | `GET/PUT /api/v1/actions`, `POST /api/v1/actions/{id}/toggle` |
| `DecisionsSection` | Hiển thị decisions với rationale | `GET /api/v1/decisions` |
| `RisksSection` | Hiển thị risks theo severity | `GET /api/v1/risks` |
| `DistributionSection` | Email, Share, Export | `POST /api/v1/minutes/{id}/distribute` |
| `EmailDistributeModal` | Chọn người nhận, preview email | `POST /api/v1/minutes/{id}/email` |

### **3.3. Post-Meeting Graph (LangGraph)**

```
┌────────────────────────────────────────────────────────────────┐
│                     POST-MEETING GRAPH                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌──────────────┐                                             │
│   │   START      │                                             │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ▼                                                     │
│   ┌──────────────┐                                             │
│   │ Transcript   │──── Consolidate full transcript             │
│   │ Consolidate  │     + In-Meeting ADR events                 │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ▼                                                     │
│   ┌──────────────┐                                             │
│   │ ADR Refiner  │──── Dedupe, fill missing, merge             │
│   │ Node         │     Override conflicts                      │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ▼                                                     │
│   ┌──────────────┐                                             │
│   │ MoM          │──── LLM Strong profile                      │
│   │ Generator    │     Long-context summarization              │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ├────────────────────────────────┐                    │
│          │                                │                    │
│          ▼                                ▼                    │
│   ┌──────────────┐                 ┌──────────────┐            │
│   │ Checker      │                 │ Highlights   │            │
│   │ Agent        │                 │ Generator    │            │
│   │ (Validation) │                 │ (Optional)   │            │
│   └──────┬───────┘                 └──────┬───────┘            │
│          │                                │                    │
│          ▼                                │                    │
│   ┌──────────────┐◄───────────────────────┘                    │
│   │ Render &     │                                             │
│   │ Sync Node    │──── PDF, Task sync, Archive                 │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ▼                                                     │
│   ┌──────────────┐                                             │
│   │ Archive &    │──── WORM storage, Audit trail               │
│   │ Compliance   │                                             │
│   └──────┬───────┘                                             │
│          │                                                     │
│          ▼                                                     │
│   ┌──────────────┐                                             │
│   │     END      │                                             │
│   └──────────────┘                                             │
└────────────────────────────────────────────────────────────────┘
```

### **3.4. Post-Meeting State**

```python
class PostMeetingState(TypedDict, total=False):
    # Context
    meeting_id: str
    stage: Literal["post"]
    
    # Input data
    full_transcript: str
    transcript_segments: List[TranscriptSegment]
    in_meeting_adr: dict  # Actions/Decisions/Risks from in-meeting
    
    # Refined ADR
    actions: List[ActionItem]
    decisions: List[Decision]
    risks: List[Risk]
    
    # Generated content
    minutes: MeetingMinutes
    executive_summary: str
    highlights: List[Highlight]
    
    # Distribution
    distribution_channels: List[str]
    distribution_status: dict
    
    # Sync
    synced_tasks: List[str]  # Task IDs in external systems
    
    # Archive
    archive_id: str
    compliance_status: str
    
    # Debug
    debug_info: dict
```

---

## **4. Data Models**

### **4.1. Agenda Item**

```python
class AgendaItem(TypedDict):
    id: str
    meeting_id: str
    title: str
    description: Optional[str]
    duration_minutes: int
    order_index: int
    presenter: Optional[str]
    status: Literal["pending", "discussed", "skipped"]
    notes: Optional[str]
    source: Literal["manual", "ai_generated", "imported"]
```

### **4.2. Reminder Item**

```python
class ReminderItem(TypedDict):
    id: str
    meeting_id: str
    type: Literal["question", "risk", "request"]
    content: str
    priority: Literal["high", "medium", "low"]
    is_completed: bool
    created_by: str
    created_at: datetime
```

### **4.3. Meeting Minutes**

```python
class MeetingMinutes(TypedDict):
    id: str
    meeting_id: str
    version: int
    minutes_markdown: str
    executive_summary: str
    key_points: List[str]
    action_items_summary: str
    decisions_summary: str
    risks_summary: str
    status: Literal["draft", "review", "approved", "published"]
    generated_at: datetime
    approved_by: Optional[str]
    approved_at: Optional[datetime]
```

### **4.4. Distribution Record**

```python
class DistributionRecord(TypedDict):
    id: str
    minutes_id: str
    channel: Literal["email", "teams", "link", "pdf"]
    recipients: List[str]
    sent_at: datetime
    status: Literal["pending", "sent", "failed"]
    error_message: Optional[str]
```

---

## **5. API Endpoints**

### **5.1. Pre-Meeting APIs**

```
POST /api/v1/meetings/{meeting_id}/prepare
  → Trigger pre-meeting preparation pipeline
  → Returns: AgendaDraft, PreReadSummary[]

GET /api/v1/meetings/{meeting_id}/agenda
  → Get agenda items for meeting
  → Returns: AgendaItem[]

POST /api/v1/meetings/{meeting_id}/agenda/generate
  → AI generate agenda from context
  → Body: { use_history: bool, use_rag: bool }
  → Returns: AgendaItem[]

POST /api/v1/meetings/{meeting_id}/agenda/items
  → Create agenda item
  → Body: AgendaItemCreate
  → Returns: AgendaItem

PUT /api/v1/meetings/{meeting_id}/agenda/items/{item_id}
  → Update agenda item
  → Body: AgendaItemUpdate
  → Returns: AgendaItem

DELETE /api/v1/meetings/{meeting_id}/agenda/items/{item_id}
  → Delete agenda item

POST /api/v1/meetings/{meeting_id}/reminders
  → Create reminder (question/risk/request)
  → Body: ReminderCreate
  → Returns: ReminderItem

GET /api/v1/meetings/{meeting_id}/reminders
  → Get reminders by type
  → Query: type=question|risk|request
  → Returns: ReminderItem[]

POST /api/v1/meetings/{meeting_id}/notify
  → Send meeting notification email
  → Body: { recipients: string[], include_agenda: bool, include_docs: bool, message: string }
  → Returns: NotificationResult
```

### **5.2. Post-Meeting APIs**

```
POST /api/v1/meetings/{meeting_id}/minutes/generate
  → AI generate meeting minutes
  → Body: GenerateMinutesRequest
  → Returns: MeetingMinutes

GET /api/v1/meetings/{meeting_id}/minutes
  → Get all versions of minutes
  → Returns: MeetingMinutes[]

GET /api/v1/meetings/{meeting_id}/minutes/latest
  → Get latest version
  → Returns: MeetingMinutes

PUT /api/v1/meetings/{meeting_id}/minutes/{version}
  → Update minutes content
  → Body: MinutesUpdate
  → Returns: MeetingMinutes

POST /api/v1/meetings/{meeting_id}/minutes/{version}/approve
  → Approve minutes
  → Returns: MeetingMinutes

POST /api/v1/meetings/{meeting_id}/minutes/{version}/distribute
  → Distribute minutes
  → Body: { channel: "email"|"teams"|"link", recipients: string[] }
  → Returns: DistributionRecord

GET /api/v1/meetings/{meeting_id}/actions
  → Get action items
  → Returns: ActionItem[]

POST /api/v1/meetings/{meeting_id}/actions/{action_id}/toggle
  → Toggle action completion
  → Returns: ActionItem

POST /api/v1/meetings/{meeting_id}/actions/sync
  → Sync actions to external system (Planner/Jira)
  → Body: { target: "planner"|"jira"|"loffice" }
  → Returns: SyncResult

GET /api/v1/meetings/{meeting_id}/decisions
  → Get decisions
  → Returns: Decision[]

GET /api/v1/meetings/{meeting_id}/risks
  → Get risks
  → Returns: Risk[]

GET /api/v1/meetings/{meeting_id}/export/pdf
  → Export meeting to PDF
  → Returns: PDF file

GET /api/v1/meetings/{meeting_id}/export/docx
  → Export meeting to DOCX
  → Returns: DOCX file
```

---

## **6. LLM Prompts**

### **6.1. Agenda Generation Prompt**

```python
AGENDA_GENERATION_PROMPT = """
Bạn là trợ lý AI chuyên về tổ chức cuộc họp cho doanh nghiệp. Nhiệm vụ của bạn là tạo agenda chi tiết cho cuộc họp dựa trên thông tin được cung cấp.

**Thông tin cuộc họp:**
- Tiêu đề: {meeting_title}
- Mô tả: {meeting_description}
- Loại họp: {meeting_type}
- Thời lượng: {duration_minutes} phút
- Thành viên: {participants}

**Lịch sử cuộc họp trước (nếu có):**
{previous_meeting_summary}

**Tài liệu liên quan:**
{rag_documents}

**Yêu cầu:**
1. Tạo agenda với 3-7 mục (tùy thời lượng)
2. Mỗi mục có: title, description, duration_minutes, presenter (nếu biết)
3. Phân bổ thời gian hợp lý
4. Ưu tiên các vấn đề quan trọng từ cuộc họp trước (follow-up actions)
5. Để 10% thời gian cho Q&A và wrap-up

**Output format (JSON):**
{
  "agenda_items": [
    {
      "title": "...",
      "description": "...",
      "duration_minutes": ...,
      "presenter": "..."
    }
  ]
}
"""
```

### **6.2. Minutes Generation Prompt**

```python
MOM_GENERATION_PROMPT = """
Bạn là trợ lý AI chuyên tạo biên bản cuộc họp chuyên nghiệp cho doanh nghiệp.

**Thông tin cuộc họp:**
- Tiêu đề: {meeting_title}
- Thời gian: {start_time} - {end_time}
- Địa điểm: {location}
- Thành viên: {participants}

**Transcript cuộc họp:**
{full_transcript}

**Action Items đã trích xuất:**
{action_items}

**Quyết định đã đưa ra:**
{decisions}

**Rủi ro đã nhận diện:**
{risks}

**Yêu cầu:**
1. Viết biên bản bằng tiếng Việt, văn phong chuyên nghiệp
2. Bao gồm các phần:
   - Tóm tắt điều hành (Executive Summary) - 3-5 câu
   - Các điểm chính đã thảo luận
   - Quyết định quan trọng
   - Action Items với người phụ trách và deadline
   - Rủi ro và biện pháp giảm thiểu
   - Bước tiếp theo
3. Gắn citations [T:mm:ss] cho các điểm quan trọng
4. Không bịa đặt thông tin không có trong transcript
5. Format: Markdown

**Output:**
Biên bản cuộc họp đầy đủ theo format markdown.
"""
```

### **6.3. ADR Refinement Prompt**

```python
ADR_REFINEMENT_PROMPT = """
Bạn là trợ lý AI chuyên xử lý Action Items, Decisions và Risks từ cuộc họp.

**Dữ liệu ADR thô từ In-Meeting:**
{raw_adr_data}

**Full Transcript để cross-check:**
{transcript_excerpt}

**Nhiệm vụ:**
1. **Actions:**
   - Loại bỏ trùng lặp (merge similar)
   - Bổ sung owner nếu nhận diện được từ transcript
   - Bổ sung due_date nếu có mention
   - Gắn source_timecode chính xác

2. **Decisions:**
   - Clarify rationale từ context
   - Xác định impact nếu có
   - Link tới related actions

3. **Risks:**
   - Xác định severity (high/medium/low)
   - Đề xuất mitigation nếu có trong thảo luận
   - Gắn owner cho risk

**Output format (JSON):**
{
  "actions": [...],
  "decisions": [...],
  "risks": [...]
}
"""
```

---

## **7. Email Templates**

### **7.1. Pre-Meeting Notification**

```html
<Subject> [MeetMate] Thông báo cuộc họp: {meeting_title} - {meeting_date}

<Body>
Kính gửi các Anh/Chị,

Cuộc họp "{meeting_title}" sẽ diễn ra vào:
📅 Ngày: {meeting_date}
⏰ Thời gian: {start_time} - {end_time}
📍 Địa điểm: {location}
🔗 Link tham gia: {teams_link}

📋 CHƯƠNG TRÌNH HỌP:
{agenda_items_formatted}

📎 TÀI LIỆU CHUẨN BỊ:
{documents_list}

💬 LƯU Ý:
{custom_message}

---
Vui lòng xác nhận tham dự.
Nếu có câu hỏi, vui lòng phản hồi email này.

Trân trọng,
MeetMate System
</Body>
```

### **7.2. Post-Meeting Minutes Distribution**

```html
<Subject> [MeetMate] Biên bản cuộc họp: {meeting_title} - {meeting_date}

<Body>
Kính gửi các Anh/Chị,

Biên bản cuộc họp "{meeting_title}" đã được hoàn thành.

📝 TÓM TẮT:
{executive_summary}

✅ ACTION ITEMS ({action_count}):
{action_items_list}

💡 QUYẾT ĐỊNH ({decision_count}):
{decisions_list}

⚠️ RỦI RO ({risk_count}):
{risks_list}

📎 TỆP ĐÍNH KÈM:
- Biên bản đầy đủ (PDF)

---
Vui lòng review và xác nhận action items được giao.

Trân trọng,
MeetMate System
</Body>
```

---

## **8. Database Schema Extensions**

### **8.1. New Tables**

```sql
-- Agenda Items
CREATE TABLE agenda_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meeting(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL,
    presenter_id UUID REFERENCES user_account(id),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    source VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders (Questions/Risks/Requests)
CREATE TABLE meeting_reminder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meeting(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'question', 'risk', 'request'
    content TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium',
    is_completed BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES user_account(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Distribution Records
CREATE TABLE distribution_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    minutes_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL, -- 'email', 'teams', 'link', 'pdf'
    recipients TEXT[], -- Array of email/user IDs
    sent_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_agenda_item_meeting ON agenda_item(meeting_id);
CREATE INDEX idx_reminder_meeting ON meeting_reminder(meeting_id);
CREATE INDEX idx_distribution_minutes ON distribution_record(minutes_id);
```

---

## **9. Frontend Implementation Details**

### **9.1. PreMeetTab Component Hierarchy**

```
PreMeetTab
├── SendEmailActionBar
│   └── onClick → setShowSendEmailModal(true)
├── SendPrepEmailModal
│   ├── RecipientSelector
│   │   └── Checkbox list with Select All/Deselect
│   ├── ContentOptions
│   │   └── Include Agenda, Docs, Reminders checkboxes
│   ├── CustomMessage
│   │   └── Textarea for additional message
│   ├── EmailPreview
│   │   └── Formatted preview of email content
│   └── SendButton
│       └── onClick → POST /meetings/{id}/notify
├── inmeet-grid
│   ├── AgendaPanel (main column)
│   │   ├── AI Generate Button
│   │   │   └── onClick → POST /agenda/generate
│   │   ├── AgendaItemList
│   │   │   └── Draggable, inline editable
│   │   └── AddItemInline
│   │       └── Quick add new item
│   ├── RemindersPanel (main column)
│   │   ├── TabNavigation
│   │   │   └── Questions | Risks | Requests
│   │   ├── ReminderList
│   │   │   └── Toggleable, priority badges
│   │   └── AddReminderInline
│   │       └── Quick add with priority
│   ├── PrepStatusPanel (side column)
│   │   └── Status indicators + countdown
│   ├── ParticipantsPanel (side column)
│   │   ├── CompactList
│   │   │   └── Avatar + name + role
│   │   └── AddParticipantModal
│   │       └── Search + multi-select
│   ├── DocumentsPanel (side column)
│   │   ├── DragDropZone
│   │   │   └── onDrop → upload files
│   │   └── DocumentList
│   │       └── Compact list with actions
│   └── AIAssistantPanel (side column)
│       ├── MessageHistory
│       │   └── Scrollable chat bubbles
│       ├── SuggestionChips
│       │   └── Quick question buttons
│       └── InputArea
│           └── Text input + send button
```

### **9.2. PostMeetTab Component Hierarchy**

```
PostMeetTab
├── SummarySection
│   ├── GenerateButton
│   │   └── onClick → POST /minutes/generate
│   ├── MinutesDisplay
│   │   └── Markdown renderer
│   ├── EditMode
│   │   └── Textarea with save/cancel
│   └── ActionButtons
│       └── Copy | Edit | Export PDF
├── StatsSection
│   └── StatCards (Actions, Decisions, Risks counts)
├── postmeet-grid
│   ├── ActionItemsSection
│   │   ├── ActionList
│   │   │   └── Checkbox + owner + due_date
│   │   └── BulkActions
│   │       └── Sync to Planner/Jira
│   └── DecisionsSection
│       └── DecisionCards
│           └── Title + rationale + impact
├── RisksSection
│   └── RiskGrid
│       └── Severity-grouped cards
├── DistributionSection
│   ├── EmailButton
│   │   └── onClick → setShowEmailModal(true)
│   ├── ShareButton
│   │   └── Copy shareable link
│   └── ExportButton
│       └── Download PDF
└── EmailDistributeModal
    ├── RecipientList
    │   └── Selectable participant list
    ├── EmailPreview
    │   └── Formatted minutes preview
    └── SendButton
        └── onClick → POST /minutes/{id}/distribute
```

---

## **10. Error Handling & Fallbacks**

### **10.1. API Error Handling**

```typescript
// Frontend error handling pattern
const handleApiCall = async (apiCall: () => Promise<any>, fallback: any) => {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    console.error('API call failed:', error);
    // Use fallback (mock data)
    return fallback;
  }
};

// Usage example
const minutes = await handleApiCall(
  () => minutesApi.generate(meetingId),
  generateMockMinutes(meeting)
);
```

### **10.2. Mock Data Strategy**

```typescript
// Mock generation for offline/demo mode
const generateMockMinutes = (meeting: Meeting): MeetingMinutes => {
  return {
    id: `mock-${meeting.id}`,
    meeting_id: meeting.id,
    version: 1,
    minutes_markdown: generateMarkdownContent(meeting),
    executive_summary: generateSummary(meeting),
    status: 'draft',
    generated_at: new Date().toISOString(),
  };
};
```

---

## **11. Performance Optimization**

### **11.1. Caching Strategy**

* **Agenda Items**: Cache in React state, invalidate on mutation
* **RAG Documents**: Server-side cache với TTL 5 phút
* **Minutes**: Local storage draft, sync on save

### **11.2. Lazy Loading**

* **Documents Panel**: Load documents only when panel is expanded
* **AI Chat History**: Paginate messages (load more on scroll)
* **Participants**: Search-as-you-type with debounce

### **11.3. Optimistic Updates**

* **Toggle Action**: Update UI immediately, rollback on error
* **Add Reminder**: Show immediately, sync in background
* **Reorder Agenda**: Drag-drop with optimistic update

---

## **12. Security Considerations**

### **12.1. Data Protection**

* **PII Masking**: Mask sensitive info before sending to LLM
* **Access Control**: RBAC for minutes approval/distribution
* **Audit Trail**: Log all actions with user, timestamp, IP

### **12.2. Email Security**

* **Rate Limiting**: Max 50 emails per meeting
* **Recipient Validation**: Only allow organization emails
* **Content Sanitization**: Remove potentially harmful content

---

## **13. Future Enhancements**

### **13.1. Pre-Meeting**

* [ ] Auto-suggest participants based on meeting topic
* [ ] Integration with project management (Jira/Azure DevOps)
* [ ] Smart scheduling based on participant availability
* [ ] Pre-read completion tracking

### **13.2. Post-Meeting**

* [ ] Video highlights extraction (timecode-based clips)
* [ ] Sentiment analysis for meeting effectiveness
* [ ] Trend analysis across multiple meetings
* [ ] Integration với BI dashboards
* [ ] Auto-generate follow-up meeting suggestion

---

## **14. Deployment Checklist**

### **14.1. Backend**

- [ ] Database migrations for new tables
- [ ] Environment variables for email service
- [ ] LLM API keys configuration
- [ ] Rate limiting middleware
- [ ] Logging and monitoring setup

### **14.2. Frontend**

- [ ] Build optimization (code splitting)
- [ ] i18n strings for new features
- [ ] Accessibility audit (WCAG 2.1)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness verification

### **14.3. Infrastructure**

- [ ] Email service (SMTP/SendGrid) configuration
- [ ] PDF generation service (optional: cloud function)
- [ ] Task sync integrations (MS Graph, Jira API)
- [ ] Storage for exported files

---

*Document Version: 1.0*  
*Last Updated: December 2024*  
*Author: MeetMate Development Team*

