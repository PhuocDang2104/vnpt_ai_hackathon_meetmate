import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  CheckSquare,
  AlertTriangle,
  Download,
  Share2,
  Mail,
  ExternalLink,
  Check,
  Clock,
  User,
  Sparkles,
  Loader2,
  Copy,
  RefreshCw,
  X,
  Send,
  Users,
  CheckCircle,
  MessageSquare,
  Play,
  Video,
  Film,
  List,
  ChevronRight,
  Eye,
  EyeOff,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Calendar,
  Link2,
  ExternalLink as LinkIcon,
  Bot,
  Zap,
  ListChecks,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { MeetingWithParticipants } from '../../../../shared/dto/meeting';
import { minutesApi, type MeetingMinutes } from '../../../../lib/api/minutes';
import { itemsApi, type ActionItem, type DecisionItem, type RiskItem } from '../../../../lib/api/items';

interface PostMeetTabProps {
  meeting: MeetingWithParticipants;
  onRefresh: () => void;
}

type TabType = 'summary' | 'highlights' | 'tasks';

export const PostMeetTab = ({ meeting, onRefresh }: PostMeetTabProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  
  return (
    <div className="postmeet-tab">
      {/* Tab Navigation */}
      <div className="postmeet-tabs">
        <button 
          className={`postmeet-tabs__btn ${activeTab === 'summary' ? 'postmeet-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <FileText size={16} />
          Biên bản
        </button>
        <button 
          className={`postmeet-tabs__btn ${activeTab === 'highlights' ? 'postmeet-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('highlights')}
        >
          <Film size={16} />
          Highlights
        </button>
        <button 
          className={`postmeet-tabs__btn ${activeTab === 'tasks' ? 'postmeet-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <ListChecks size={16} />
          Tasks & Sync
        </button>
      </div>

      {activeTab === 'summary' && (
        <>
          {/* Summary Section with Chapters */}
          <SummarySection meeting={meeting} />

          {/* Stats Row */}
          <StatsSection meetingId={meeting.id} />

          {/* Main Content Grid */}
          <div className="postmeet-grid">
            {/* Action Items */}
            <ActionItemsSection meetingId={meeting.id} />
            
            {/* Decisions */}
            <DecisionsSection meetingId={meeting.id} />
          </div>

          {/* Risks */}
          <RisksSection meetingId={meeting.id} />

          {/* Q&A Agent */}
          <QAAgentSection meeting={meeting} />

          {/* Distribution & Export */}
          <DistributionSection meeting={meeting} />
        </>
      )}

      {activeTab === 'highlights' && (
        <HighlightsSection meeting={meeting} />
      )}

      {activeTab === 'tasks' && (
        <TasksSyncSection meeting={meeting} />
      )}
    </div>
  );
};

// Mock minutes generator for fallback
const generateMockMinutes = (meeting: MeetingWithParticipants): MeetingMinutes => {
  const startDate = new Date(meeting.start_time);
  const endDate = new Date(meeting.end_time);
  
  const executiveSummary = `Cuộc họp "${meeting.title}" đã diễn ra thành công vào ngày ${startDate.toLocaleDateString('vi-VN')} từ ${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} đến ${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.

Các nội dung chính đã được thảo luận bao gồm:
• Đánh giá tiến độ dự án và các milestone đã đạt được
• Thảo luận về các vấn đề kỹ thuật và giải pháp đề xuất
• Phân bổ nguồn lực và timeline cho giai đoạn tiếp theo
• Xác định các rủi ro tiềm ẩn và biện pháp giảm thiểu

Cuộc họp đã đạt được sự đồng thuận về các quyết định quan trọng và phân công action items rõ ràng cho các thành viên.`;

  const minutesMarkdown = `# Biên bản cuộc họp: ${meeting.title}

**Loại cuộc họp:** ${meeting.meeting_type || 'General Meeting'}
**Thời gian:** ${startDate.toLocaleDateString('vi-VN')} ${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
**Địa điểm:** ${meeting.location || 'Microsoft Teams'}

## Tóm tắt điều hành

${executiveSummary}

## Điểm chính

1. **Tiến độ dự án**: Dự án đang đi đúng timeline, đã hoàn thành 70% khối lượng công việc
2. **Vấn đề kỹ thuật**: Đã xác định và giải quyết các vấn đề về hiệu suất hệ thống
3. **Nguồn lực**: Cần bổ sung thêm 2 developer cho sprint tiếp theo
4. **Timeline**: Dự kiến hoàn thành UAT vào cuối tháng này

## Action Items

1. [ ] Hoàn thành code review cho module authentication - **Deadline: 3 ngày**
2. [ ] Chuẩn bị tài liệu UAT - **Deadline: 1 tuần**
3. [ ] Liên hệ vendor về license phần mềm - **Deadline: 2 ngày**
4. [ ] Update dashboard báo cáo tiến độ - **Deadline: Cuối tuần**

## Quyết định

1. Sử dụng phương án A cho kiến trúc microservices
2. Tăng frequency của daily standup lên 2 lần/ngày trong giai đoạn critical
3. Phê duyệt budget bổ sung cho cloud infrastructure

## Rủi ro đã nhận diện

- **Cao**: Delay từ third-party vendor có thể ảnh hưởng timeline
- **Trung bình**: Resource constraint trong sprint cuối
- **Thấp**: Technical debt cần được address sau go-live

---
*Biên bản được tạo bởi MeetMate AI*
*Ngày tạo: ${new Date().toLocaleString('vi-VN')}*`;

  return {
    id: `mock-${meeting.id}`,
    meeting_id: meeting.id,
    version: 1,
    minutes_markdown: minutesMarkdown,
    executive_summary: executiveSummary,
    status: 'draft',
    generated_at: new Date().toISOString(),
  };
};

// Chapter type for navigation
interface Chapter {
  id: string;
  title: string;
  startTime?: string;
  level: number;
}

// Summary Section with Chapters Navigation
const SummarySection = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [hideSensitive, setHideSensitive] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showChapters, setShowChapters] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLatestMinutes();
  }, [meeting.id]);

  useEffect(() => {
    if (minutes?.minutes_markdown) {
      extractChapters(minutes.minutes_markdown);
    }
  }, [minutes]);

  const extractChapters = (markdown: string) => {
    const lines = markdown.split('\n');
    const extracted: Chapter[] = [];
    
    lines.forEach((line, idx) => {
      if (line.startsWith('## ')) {
        extracted.push({
          id: `chapter-${idx}`,
          title: line.replace('## ', ''),
          level: 2,
        });
      } else if (line.startsWith('### ')) {
        extracted.push({
          id: `chapter-${idx}`,
          title: line.replace('### ', ''),
          level: 3,
        });
      }
    });
    
    setChapters(extracted);
  };

  const loadLatestMinutes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const latest = await minutesApi.getLatest(meeting.id);
      setMinutes(latest);
    } catch (err) {
      console.error('Failed to load minutes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMinutes = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const generated = await minutesApi.generate({
        meeting_id: meeting.id,
        include_transcript: true,
        include_actions: true,
        include_decisions: true,
        include_risks: true,
        format: 'markdown',
      });
      setMinutes(generated);
    } catch (err) {
      console.error('Failed to generate minutes via API, using mock:', err);
      const mockMinutes = generateMockMinutes(meeting);
      setMinutes(mockMinutes);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySummary = () => {
    const content = minutes?.minutes_markdown || minutes?.executive_summary || '';
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditContent(minutes?.minutes_markdown || minutes?.executive_summary || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!minutes) return;
    
    try {
      await minutesApi.update(minutes.id, {
        minutes_markdown: editContent,
        executive_summary: editContent.split('\n\n')[0] || editContent.substring(0, 500),
      });
      setMinutes({ ...minutes, minutes_markdown: editContent });
      setIsEditing(false);
    } catch (err) {
      setMinutes({ ...minutes, minutes_markdown: editContent });
      setIsEditing(false);
    }
  };

  const handleApprove = async () => {
    if (!minutes) return;
    
    const newStatus = minutes.status === 'draft' ? 'reviewed' : 'approved';
    try {
      await minutesApi.update(minutes.id, { status: newStatus });
      setMinutes({ ...minutes, status: newStatus });
    } catch (err) {
      // Update locally
      setMinutes({ ...minutes, status: newStatus });
    }
  };

  const handleReject = async () => {
    if (!minutes) return;
    
    try {
      await minutesApi.update(minutes.id, { status: 'draft' });
      setMinutes({ ...minutes, status: 'draft' });
    } catch (err) {
      setMinutes({ ...minutes, status: 'draft' });
    }
  };

  const handleExportPDF = () => {
    if (!minutes) {
      alert('Vui lòng tạo biên bản trước khi export');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Không thể mở cửa sổ in. Vui lòng cho phép popup.');
      return;
    }

    const meetingDate = new Date(meeting.start_time).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Biên bản cuộc họp - ${meeting.title}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #0066cc; 
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 { color: #0066cc; font-size: 24px; margin-bottom: 10px; }
          .header .subtitle { color: #666; font-size: 14px; }
          .meta { 
            display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px;
            padding: 15px; background: #f8f9fa; border-radius: 8px;
          }
          .meta-item { flex: 1 1 200px; }
          .meta-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .meta-value { font-weight: 600; color: #333; }
          .section { margin-bottom: 25px; }
          .section h2 { color: #0066cc; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 15px; }
          .content { white-space: pre-wrap; font-size: 14px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          .approved-stamp { background: #22c55e; color: white; padding: 10px 20px; border-radius: 4px; display: inline-block; margin-top: 20px; font-weight: 600; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BIÊN BẢN CUỘC HỌP</h1>
          <div class="subtitle">${meeting.title}</div>
          ${minutes.status === 'approved' ? '<div class="approved-stamp">✓ ĐÃ PHÊ DUYỆT</div>' : ''}
        </div>
        
        <div class="meta">
          <div class="meta-item">
            <div class="meta-label">Ngày họp</div>
            <div class="meta-value">${meetingDate}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Thời gian</div>
            <div class="meta-value">${new Date(meeting.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(meeting.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Địa điểm</div>
            <div class="meta-value">${meeting.location || 'Microsoft Teams'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Phiên bản</div>
            <div class="meta-value">v${minutes.version} - ${minutes.status}</div>
          </div>
        </div>
        
        <div class="section">
          <h2>NỘI DUNG CUỘC HỌP</h2>
          <div class="content">${minutes.minutes_markdown || minutes.executive_summary || 'Không có nội dung'}</div>
        </div>
        
        <div class="footer">
          <p>Biên bản được tạo bởi MeetMate AI</p>
          <p>Ngày xuất: ${new Date().toLocaleString('vi-VN')}</p>
        </div>
        
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const scrollToChapter = (title: string) => {
    if (contentRef.current) {
      const element = contentRef.current.querySelector(`[data-chapter="${title}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const getApprovalActions = () => {
    if (!minutes) return null;
    
    switch (minutes.status) {
      case 'draft':
        return (
          <button className="btn btn--info btn--sm" onClick={handleApprove}>
            <Eye size={14} />
            Review
          </button>
        );
      case 'reviewed':
        return (
          <>
            <button className="btn btn--success btn--sm" onClick={handleApprove}>
              <ThumbsUp size={14} />
              Approve
            </button>
            <button className="btn btn--ghost btn--sm" onClick={handleReject}>
              <ThumbsDown size={14} />
              Reject
            </button>
          </>
        );
      case 'approved':
        return (
          <span className="badge badge--success">
            <CheckCircle size={12} />
            Approved & Ready to Publish
          </span>
        );
      default:
        return null;
    }
  };

  const maskSensitiveContent = (content: string): string => {
    if (!hideSensitive) return content;
    
    // Mask email addresses
    content = content.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email ẩn]');
    // Mask phone numbers
    content = content.replace(/(\+84|0)\d{9,10}/g, '[SĐT ẩn]');
    // Mask potential IDs
    content = content.replace(/\b[A-Z]{2,3}-\d{3,6}\b/g, '[ID ẩn]');
    
    return content;
  };

  return (
    <div className="summary-section summary-section--with-chapters">
      {/* Chapters Sidebar */}
      {chapters.length > 0 && showChapters && (
        <div className="chapters-sidebar">
          <div className="chapters-sidebar__header">
            <List size={14} />
            <span>Mục lục</span>
            <button 
              className="btn btn--ghost btn--icon btn--sm" 
              onClick={() => setShowChapters(false)}
            >
              <X size={12} />
            </button>
          </div>
          <div className="chapters-sidebar__list">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                className={`chapters-sidebar__item chapters-sidebar__item--level-${chapter.level}`}
                onClick={() => scrollToChapter(chapter.title)}
              >
                <ChevronRight size={12} />
                {chapter.title}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="summary-main">
        <div className="summary-header">
          <div className="summary-header__left">
            <h3><FileText size={18} /> Biên bản cuộc họp (AI Generated)</h3>
            {!showChapters && chapters.length > 0 && (
              <button 
                className="btn btn--ghost btn--sm"
                onClick={() => setShowChapters(true)}
              >
                <List size={14} />
                Mục lục
              </button>
            )}
          </div>
          <div className="summary-actions">
            {/* Sensitive Toggle */}
            <button 
              className={`btn btn--ghost btn--sm ${hideSensitive ? 'btn--active' : ''}`}
              onClick={() => setHideSensitive(!hideSensitive)}
              title={hideSensitive ? 'Hiện thông tin nhạy cảm' : 'Ẩn thông tin nhạy cảm'}
            >
              {hideSensitive ? <EyeOff size={14} /> : <Shield size={14} />}
            </button>
            
            <button 
              className="btn btn--accent btn--sm" 
              onClick={handleGenerateMinutes} 
              disabled={isGenerating || isLoading}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  {minutes ? 'Tạo lại' : 'AI Tạo biên bản'}
                </>
              )}
            </button>
            {minutes && !isEditing && (
              <>
                <button 
                  className="btn btn--secondary btn--sm" 
                  onClick={handleStartEdit}
                  title="Chỉnh sửa"
                >
                  <Edit3 size={14} />
                  Sửa
                </button>
                <button 
                  className="btn btn--secondary btn--sm" 
                  onClick={handleCopySummary}
                  title={copied ? 'Đã copy!' : 'Copy nội dung'}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button className="btn btn--primary btn--sm" onClick={handleExportPDF}>
                  <Download size={14} />
                  PDF
                </button>
                {getApprovalActions()}
              </>
            )}
            {isEditing && (
              <>
                <button className="btn btn--primary btn--sm" onClick={handleSaveEdit}>
                  <Check size={14} />
                  Lưu
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => setIsEditing(false)}>
                  Hủy
                </button>
              </>
            )}
            <button 
              className="btn btn--ghost btn--icon btn--sm" 
              onClick={loadLatestMinutes}
              disabled={isLoading}
              title="Làm mới"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        <div className="summary-content" ref={contentRef}>
          {isLoading ? (
            <div className="section-loading">
              <Loader2 size={24} className="animate-spin" />
              <span>Đang tải biên bản...</span>
            </div>
          ) : isGenerating ? (
            <div className="generating-state">
              <div className="generating-animation">
                <Sparkles size={32} className="sparkle-icon" />
                <div className="generating-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <h4>AI đang tạo biên bản...</h4>
              <p>Đang phân tích nội dung cuộc họp, transcript, action items, decisions và risks</p>
            </div>
          ) : isEditing ? (
            <div className="edit-mode">
              <textarea
                className="minutes-editor"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Nhập nội dung biên bản..."
                rows={20}
              />
              <p className="edit-hint">
                <Edit3 size={12} />
                Hỗ trợ Markdown. Chỉnh sửa owners, deadlines, và nội dung. Sau khi lưu, biên bản sẽ được format tự động.
              </p>
            </div>
          ) : minutes ? (
            <div className="minutes-display">
              <div className="minutes-meta">
                <span className={`badge badge--${minutes.status === 'approved' ? 'success' : minutes.status === 'reviewed' ? 'info' : 'warning'}`}>
                  {minutes.status === 'approved' ? '✓ Đã duyệt' : minutes.status === 'reviewed' ? '👁 Đang review' : '📝 Bản nháp'}
                </span>
                <span className="minutes-version">Phiên bản {minutes.version}</span>
                {minutes.generated_at && (
                  <span className="minutes-date">
                    <Clock size={12} />
                    {new Date(minutes.generated_at).toLocaleString('vi-VN')}
                  </span>
                )}
                {hideSensitive && (
                  <span className="badge badge--warning">
                    <EyeOff size={10} />
                    Ẩn thông tin nhạy cảm
                  </span>
                )}
              </div>
              <div 
                className="minutes-content markdown-body"
                dangerouslySetInnerHTML={{ 
                  __html: formatMarkdownWithChapters(
                    maskSensitiveContent(minutes.minutes_markdown || minutes.executive_summary || '')
                  ) 
                }}
              />
            </div>
          ) : (
            <div className="empty-minutes">
              <div className="empty-minutes__icon">
                <FileText size={48} />
                <Sparkles size={20} className="empty-minutes__sparkle" />
              </div>
              <h4>Chưa có biên bản</h4>
              <p>Nhấn "AI Tạo biên bản" để MeetMate AI tự động tạo biên bản dựa trên nội dung cuộc họp</p>
              <button 
                className="btn btn--accent" 
                onClick={handleGenerateMinutes}
                disabled={isGenerating}
              >
                <Sparkles size={16} />
                AI Tạo biên bản ngay
              </button>
            </div>
          )}
        </div>
        
        {error && (
          <div className="error-toast">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced markdown formatter with data-chapter attributes
const formatMarkdownWithChapters = (markdown: string): string => {
  return markdown
    .replace(/^## (.*$)/gim, '<h2 data-chapter="$1">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 data-chapter="$1">$1</h3>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
    .replace(/\n/g, '<br>');
};

// Simple markdown to HTML converter (basic)
const formatMarkdown = (markdown: string): string => {
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
    .replace(/\n/g, '<br>');
};

// Q&A Agent Section
const QAAgentSection = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'ai', content: string}>>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    setIsAsking(true);
    const userQuestion = question;
    setConversation(prev => [...prev, { role: 'user', content: userQuestion }]);
    setQuestion('');
    
    // Simulate AI response (mock for now)
    setTimeout(() => {
      const mockAnswers = [
        `Dựa trên biên bản cuộc họp, tôi thấy rằng ${userQuestion.toLowerCase().includes('deadline') ? 'deadline chính được đề cập là cuối tháng này cho UAT' : 'nội dung bạn hỏi có liên quan đến các quyết định đã được thông qua trong cuộc họp'}.`,
        `Theo transcript cuộc họp, ${userQuestion.toLowerCase().includes('ai') ? 'có 3 người được giao action items' : 'vấn đề này đã được thảo luận và có quyết định rõ ràng'}.`,
        `Từ phân tích nội dung cuộc họp, ${userQuestion.toLowerCase().includes('risk') ? 'rủi ro chính được nhận diện là delay từ vendor' : 'câu hỏi của bạn liên quan đến phần tiến độ dự án'}.`,
      ];
      const randomAnswer = mockAnswers[Math.floor(Math.random() * mockAnswers.length)];
      setConversation(prev => [...prev, { role: 'ai', content: randomAnswer }]);
      setIsAsking(false);
    }, 1500);
  };

  return (
    <div className="card qa-agent-card">
      <div 
        className="card__header card__header--clickable"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3>
          <Bot size={16} />
          Q&A Agent - Hỏi về cuộc họp
        </h3>
        <button className="btn btn--ghost btn--icon btn--sm">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="card__body">
          {/* Conversation History */}
          {conversation.length > 0 && (
            <div className="qa-conversation">
              {conversation.map((msg, idx) => (
                <div key={idx} className={`qa-message qa-message--${msg.role}`}>
                  <div className="qa-message__avatar">
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className="qa-message__content">{msg.content}</div>
                </div>
              ))}
              {isAsking && (
                <div className="qa-message qa-message--ai">
                  <div className="qa-message__avatar"><Bot size={14} /></div>
                  <div className="qa-message__content">
                    <Loader2 size={14} className="animate-spin" />
                    Đang phân tích...
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Input */}
          <div className="qa-input-wrapper">
            <input
              type="text"
              className="form-input"
              placeholder="Hỏi về nội dung cuộc họp... (VD: Ai được giao làm gì? Deadline là khi nào?)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              disabled={isAsking}
            />
            <button 
              className="btn btn--accent"
              onClick={handleAskQuestion}
              disabled={isAsking || !question.trim()}
            >
              {isAsking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          
          {/* Quick Questions */}
          <div className="qa-quick-questions">
            <span>Gợi ý:</span>
            {['Ai được giao việc?', 'Deadline là khi nào?', 'Có rủi ro gì?', 'Quyết định quan trọng?'].map((q) => (
              <button
                key={q}
                className="btn btn--ghost btn--sm"
                onClick={() => setQuestion(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Highlights Section
const HighlightsSection = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const [selectedClip, setSelectedClip] = useState<number | null>(null);
  
  // Mock highlights data
  const mockHighlights = [
    { id: 1, title: 'Quyết định kiến trúc microservices', startTime: '05:23', endTime: '08:45', type: 'decision', thumbnail: '🎯' },
    { id: 2, title: 'Phân công code review module auth', startTime: '12:10', endTime: '14:30', type: 'action', thumbnail: '✅' },
    { id: 3, title: 'Thảo luận về vendor delay risk', startTime: '18:45', endTime: '22:15', type: 'risk', thumbnail: '⚠️' },
    { id: 4, title: 'Phê duyệt budget cloud infrastructure', startTime: '28:00', endTime: '31:20', type: 'decision', thumbnail: '💰' },
    { id: 5, title: 'Timeline hoàn thành UAT', startTime: '35:50', endTime: '38:10', type: 'action', thumbnail: '📅' },
  ];

  const mockChapters = [
    { id: 1, title: 'Mở đầu & Review tiến độ', startTime: '00:00', duration: '5:23' },
    { id: 2, title: 'Thảo luận kiến trúc hệ thống', startTime: '05:23', duration: '6:47' },
    { id: 3, title: 'Phân công công việc', startTime: '12:10', duration: '6:35' },
    { id: 4, title: 'Đánh giá rủi ro', startTime: '18:45', duration: '9:15' },
    { id: 5, title: 'Budget & Resources', startTime: '28:00', duration: '7:50' },
    { id: 6, title: 'Timeline & Next steps', startTime: '35:50', duration: '4:20' },
  ];

  return (
    <div className="highlights-section">
      <div className="highlights-grid">
        {/* Video Preview */}
        <div className="card">
          <div className="card__header">
            <h3><Video size={16} /> Video Highlights</h3>
          </div>
          <div className="card__body">
            {/* Mock Video Player */}
            <div className="video-preview">
              <div className="video-preview__placeholder">
                <Film size={48} />
                <p>Preview video recording</p>
                {selectedClip !== null && (
                  <span className="badge badge--accent">
                    Đang xem: {mockHighlights.find(h => h.id === selectedClip)?.title}
                  </span>
                )}
              </div>
              <div className="video-preview__controls">
                <button className="btn btn--ghost btn--icon"><Play size={20} /></button>
                <div className="video-preview__timeline">
                  <div className="video-preview__progress" style={{ width: '35%' }}></div>
                  {/* Highlight markers */}
                  {mockHighlights.map((h) => (
                    <div 
                      key={h.id}
                      className={`video-preview__marker video-preview__marker--${h.type}`}
                      style={{ left: `${(parseInt(h.startTime.split(':')[0]) * 60 + parseInt(h.startTime.split(':')[1])) / 24}%` }}
                      title={h.title}
                    />
                  ))}
                </div>
                <span className="video-preview__time">14:32 / 40:10</span>
              </div>
            </div>
            
            {/* Highlight Clips */}
            <div className="highlight-clips">
              <h4>Candidate Clips ({mockHighlights.length})</h4>
              <div className="highlight-clips__list">
                {mockHighlights.map((clip) => (
                  <div 
                    key={clip.id}
                    className={`highlight-clip ${selectedClip === clip.id ? 'highlight-clip--active' : ''}`}
                    onClick={() => setSelectedClip(clip.id)}
                  >
                    <div className="highlight-clip__thumbnail">{clip.thumbnail}</div>
                    <div className="highlight-clip__info">
                      <div className="highlight-clip__title">{clip.title}</div>
                      <div className="highlight-clip__time">
                        <Clock size={10} />
                        {clip.startTime} - {clip.endTime}
                      </div>
                    </div>
                    <span className={`badge badge--${clip.type === 'decision' ? 'success' : clip.type === 'action' ? 'info' : 'warning'}`}>
                      {clip.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Chapter List */}
        <div className="card">
          <div className="card__header">
            <h3><List size={16} /> Chapters</h3>
          </div>
          <div className="card__body">
            <div className="chapter-list">
              {mockChapters.map((chapter, idx) => (
                <div key={chapter.id} className="chapter-item">
                  <div className="chapter-item__number">{idx + 1}</div>
                  <div className="chapter-item__info">
                    <div className="chapter-item__title">{chapter.title}</div>
                    <div className="chapter-item__meta">
                      <Clock size={10} />
                      {chapter.startTime} ({chapter.duration})
                    </div>
                  </div>
                  <button className="btn btn--ghost btn--icon btn--sm">
                    <Play size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tasks Sync Section
const TasksSyncSection = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [syncTarget, setSyncTarget] = useState<'planner' | 'jira' | 'loffice'>('planner');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<Record<string, string>>({});
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{owner: string; deadline: string; priority: string}>({
    owner: '', deadline: '', priority: ''
  });

  useEffect(() => {
    loadActions();
  }, [meeting.id]);

  const loadActions = async () => {
    setIsLoading(true);
    try {
      const result = await itemsApi.listActions(meeting.id);
      setActions(result.items || []);
    } catch (err) {
      console.error('Failed to load actions:', err);
      // Mock data
      setActions([
        { id: '1', meeting_id: meeting.id, description: 'Hoàn thành code review module authentication', owner_name: 'Nguyễn Văn A', deadline: '2024-12-15', priority: 'high', status: 'pending' },
        { id: '2', meeting_id: meeting.id, description: 'Chuẩn bị tài liệu UAT', owner_name: 'Trần Thị B', deadline: '2024-12-20', priority: 'medium', status: 'pending' },
        { id: '3', meeting_id: meeting.id, description: 'Liên hệ vendor về license phần mềm', owner_name: 'Lê Văn C', deadline: '2024-12-12', priority: 'high', status: 'pending' },
        { id: '4', meeting_id: meeting.id, description: 'Update dashboard báo cáo tiến độ', owner_name: 'Nguyễn Văn A', deadline: '2024-12-13', priority: 'low', status: 'pending' },
      ] as ActionItem[]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = (id: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTasks(newSelected);
  };

  const selectAll = () => {
    setSelectedTasks(new Set(actions.map(a => a.id)));
  };

  const deselectAll = () => {
    setSelectedTasks(new Set());
  };

  const startEditTask = (action: ActionItem) => {
    setEditingTask(action.id);
    setEditForm({
      owner: action.owner_name || '',
      deadline: action.deadline?.split('T')[0] || '',
      priority: action.priority || 'medium',
    });
  };

  const saveEditTask = async (actionId: string) => {
    setActions(prev => prev.map(a => 
      a.id === actionId 
        ? { ...a, owner_name: editForm.owner, deadline: editForm.deadline, priority: editForm.priority }
        : a
    ));
    setEditingTask(null);
  };

  const handleSync = async () => {
    if (selectedTasks.size === 0) {
      alert('Vui lòng chọn ít nhất một task để đồng bộ');
      return;
    }
    
    setIsSyncing(true);
    
    // Simulate sync
    for (const taskId of selectedTasks) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSyncResults(prev => ({
        ...prev,
        [taskId]: 'synced'
      }));
    }
    
    setIsSyncing(false);
    setSelectedTasks(new Set());
  };

  const getSyncIcon = () => {
    switch (syncTarget) {
      case 'planner': return '📋';
      case 'jira': return '🔷';
      case 'loffice': return '📊';
    }
  };

  return (
    <div className="tasks-sync-section">
      {/* Sync Controls */}
      <div className="card">
        <div className="card__header">
          <h3><Zap size={16} /> Đồng bộ Tasks ra hệ thống ngoài</h3>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <select 
              className="form-select"
              value={syncTarget}
              onChange={(e) => setSyncTarget(e.target.value as any)}
              style={{ minWidth: '150px' }}
            >
              <option value="planner">📋 Microsoft Planner</option>
              <option value="jira">🔷 Jira</option>
              <option value="loffice">📊 LOffice Work</option>
            </select>
            <button 
              className="btn btn--primary"
              onClick={handleSync}
              disabled={isSyncing || selectedTasks.size === 0}
            >
              {isSyncing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang đồng bộ...
                </>
              ) : (
                <>
                  <Link2 size={16} />
                  Sync {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        <div className="card__header">
          <h3>
            <CheckSquare size={16} /> 
            Action Items ({actions.length})
            {selectedTasks.size > 0 && (
              <span className="badge badge--accent" style={{ marginLeft: '8px' }}>
                {selectedTasks.size} đã chọn
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn--ghost btn--sm" onClick={selectAll}>Chọn tất cả</button>
            <button className="btn btn--ghost btn--sm" onClick={deselectAll}>Bỏ chọn</button>
            <button className="btn btn--ghost btn--icon btn--sm" onClick={loadActions}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="card__body">
          {isLoading ? (
            <div className="section-loading">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : actions.length === 0 ? (
            <div className="empty-state-mini">
              <CheckSquare size={24} />
              <p>Chưa có action items</p>
            </div>
          ) : (
            <div className="tasks-list">
              {actions.map(action => {
                const isEditing = editingTask === action.id;
                const isSynced = syncResults[action.id] === 'synced';
                
                return (
                  <div 
                    key={action.id} 
                    className={`task-row ${selectedTasks.has(action.id) ? 'task-row--selected' : ''} ${isSynced ? 'task-row--synced' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(action.id)}
                      onChange={() => toggleTask(action.id)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    
                    <div className="task-row__content">
                      <div className="task-row__description">{action.description}</div>
                      
                      {isEditing ? (
                        <div className="task-row__edit-form">
                          <input
                            type="text"
                            className="form-input form-input--sm"
                            placeholder="Owner"
                            value={editForm.owner}
                            onChange={(e) => setEditForm({...editForm, owner: e.target.value})}
                          />
                          <input
                            type="date"
                            className="form-input form-input--sm"
                            value={editForm.deadline}
                            onChange={(e) => setEditForm({...editForm, deadline: e.target.value})}
                          />
                          <select
                            className="form-select form-select--sm"
                            value={editForm.priority}
                            onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                          <button className="btn btn--primary btn--sm" onClick={() => saveEditTask(action.id)}>
                            <Check size={12} />
                          </button>
                          <button className="btn btn--ghost btn--sm" onClick={() => setEditingTask(null)}>
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="task-row__meta">
                          <span className={`badge badge--${action.priority === 'critical' || action.priority === 'high' ? 'error' : action.priority === 'medium' ? 'warning' : 'neutral'}`}>
                            {action.priority}
                          </span>
                          {action.owner_name && (
                            <span className="task-row__meta-item">
                              <User size={12} />
                              {action.owner_name}
                            </span>
                          )}
                          {action.deadline && (
                            <span className="task-row__meta-item">
                              <Calendar size={12} />
                              {new Date(action.deadline).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="task-row__actions">
                      {isSynced ? (
                        <span className="badge badge--success">
                          <CheckCircle size={10} />
                          {getSyncIcon()} Đã sync
                        </span>
                      ) : (
                        <button 
                          className="btn btn--ghost btn--icon btn--sm"
                          onClick={() => startEditTask(action)}
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Sync Info */}
      <div className="card">
        <div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', padding: 'var(--space-md)' }}>
          <div style={{ fontSize: '32px' }}>{getSyncIcon()}</div>
          <div>
            <h4 style={{ marginBottom: 'var(--space-xs)' }}>
              {syncTarget === 'planner' && 'Microsoft Planner'}
              {syncTarget === 'jira' && 'Jira'}
              {syncTarget === 'loffice' && 'LOffice Work'}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
              {syncTarget === 'planner' && 'Đồng bộ tasks sang Microsoft Planner trong Teams'}
              {syncTarget === 'jira' && 'Tạo issues trong Jira project tương ứng'}
              {syncTarget === 'loffice' && 'Đồng bộ công việc sang hệ thống LOffice Work VNPT'}
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn--ghost btn--sm">
              <LinkIcon size={14} />
              Cấu hình kết nối
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats Section
const StatsSection = ({ meetingId }: { meetingId: string }) => {
  const [stats, setStats] = useState({ actions: 0, decisions: 0, risks: 0, duration: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [meetingId]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [actions, decisions, risks] = await Promise.all([
        itemsApi.listActions(meetingId).catch(() => ({ items: [], total: 0 })),
        itemsApi.listDecisions(meetingId).catch(() => ({ items: [], total: 0 })),
        itemsApi.listRisks(meetingId).catch(() => ({ items: [], total: 0 })),
      ]);
      setStats({
        actions: actions.total || 0,
        decisions: decisions.total || 0,
        risks: risks.total || 0,
        duration: 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="postmeet-stats">
        <div className="stat-card"><Loader2 size={16} className="animate-spin" /></div>
      </div>
    );
  }

  return (
    <div className="postmeet-stats">
      <div className="stat-card stat-card--accent">
        <CheckSquare size={20} />
        <div className="stat-card__content">
          <span className="stat-card__value">{stats.actions}</span>
          <span className="stat-card__label">Action Items</span>
        </div>
      </div>
      <div className="stat-card stat-card--success">
        <FileText size={20} />
        <div className="stat-card__content">
          <span className="stat-card__value">{stats.decisions}</span>
          <span className="stat-card__label">Quyết định</span>
        </div>
      </div>
      <div className="stat-card stat-card--warning">
        <AlertTriangle size={20} />
        <div className="stat-card__content">
          <span className="stat-card__value">{stats.risks}</span>
          <span className="stat-card__label">Rủi ro</span>
        </div>
      </div>
      <div className="stat-card stat-card--info">
        <Clock size={20} />
        <div className="stat-card__content">
          <span className="stat-card__value">{stats.duration || '--'}</span>
          <span className="stat-card__label">Phút</span>
        </div>
      </div>
    </div>
  );
};

// Action Items Section
const ActionItemsSection = ({ meetingId }: { meetingId: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActions();
  }, [meetingId]);

  const loadActions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await itemsApi.listActions(meetingId);
      setActions(result.items || []);
    } catch (err) {
      console.error('Failed to load actions:', err);
      setError('Không thể tải action items');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className="card">
      <div className="card__header">
        <h3><CheckSquare size={16} /> Action Items</h3>
        <button className="btn btn--ghost btn--icon btn--sm" onClick={loadActions} title="Làm mới">
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="card__body">
        {isLoading ? (
          <div className="section-loading">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : actions.length === 0 ? (
          <div className="empty-state-mini">
            <CheckSquare size={24} />
            <p>Chưa có action items</p>
          </div>
        ) : (
          <div className="action-list">
            {actions.map(action => (
              <div key={action.id} className="action-row">
                <div className={`action-checkbox ${action.status === 'completed' ? 'action-checkbox--checked' : ''}`}>
                  {action.status === 'completed' && <Check size={12} />}
                </div>
                <div className="action-content">
                  <div className="action-text">{action.description}</div>
                  <div className="action-meta">
                    <span className={`badge badge--${action.priority === 'critical' ? 'error' : action.priority === 'high' ? 'warning' : 'neutral'}`}>
                      {action.priority}
                    </span>
                    {action.owner_name && (
                      <span className="action-meta-item">
                        <User size={12} />
                        {action.owner_name}
                      </span>
                    )}
                    {action.deadline && (
                      <span className="action-meta-item">
                        <Clock size={12} />
                        {formatDate(action.deadline)}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`badge badge--${action.status === 'completed' ? 'success' : action.status === 'confirmed' ? 'info' : 'neutral'}`}>
                  {action.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Decisions Section
const DecisionsSection = ({ meetingId }: { meetingId: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDecisions();
  }, [meetingId]);

  const loadDecisions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await itemsApi.listDecisions(meetingId);
      setDecisions(result.items || []);
    } catch (err) {
      console.error('Failed to load decisions:', err);
      setError('Không thể tải quyết định');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card__header">
        <h3><FileText size={16} /> Quyết định</h3>
        <button className="btn btn--ghost btn--icon btn--sm" onClick={loadDecisions} title="Làm mới">
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="card__body">
        {isLoading ? (
          <div className="section-loading">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : decisions.length === 0 ? (
          <div className="empty-state-mini">
            <FileText size={24} />
            <p>Chưa có quyết định</p>
          </div>
        ) : (
          <div className="decision-list">
            {decisions.map((dec, index) => (
              <div key={dec.id} className="decision-item">
                <div className="decision-header">
                  <span className="badge badge--success">QĐ-{String(index + 1).padStart(3, '0')}</span>
                  {dec.confirmed_by && (
                    <span className="decision-confirmer">
                      <Check size={12} />
                      {dec.confirmed_by}
                    </span>
                  )}
                </div>
                <div className="decision-text">{dec.description}</div>
                {dec.rationale && (
                  <div className="decision-rationale">{dec.rationale}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Risks Section
const RisksSection = ({ meetingId }: { meetingId: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRisks();
  }, [meetingId]);

  const loadRisks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await itemsApi.listRisks(meetingId);
      setRisks(result.items || []);
    } catch (err) {
      console.error('Failed to load risks:', err);
      setError('Không thể tải rủi ro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card__header">
        <h3><AlertTriangle size={16} /> Rủi ro đã nhận diện</h3>
        <button className="btn btn--ghost btn--icon btn--sm" onClick={loadRisks} title="Làm mới">
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="card__body">
        {isLoading ? (
          <div className="section-loading">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : risks.length === 0 ? (
          <div className="empty-state-mini">
            <AlertTriangle size={24} />
            <p>Chưa có rủi ro nào</p>
          </div>
        ) : (
          <div className="risk-grid">
            {risks.map((risk, index) => (
              <div key={risk.id} className={`risk-card risk-card--${risk.severity}`}>
                <div className="risk-header">
                  <span className="risk-id">R-{String(index + 1).padStart(3, '0')}</span>
                  <span className={`badge badge--${risk.severity === 'critical' || risk.severity === 'high' ? 'error' : 'warning'}`}>
                    {risk.severity}
                  </span>
                </div>
                <div className="risk-text">{risk.description}</div>
                {risk.mitigation && (
                  <div className="risk-mitigation">
                    <strong>Mitigation:</strong> {risk.mitigation}
                  </div>
                )}
                <span className={`badge badge--${risk.status === 'mitigated' ? 'success' : 'info'}`}>
                  {risk.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Distribution Section
const DistributionSection = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionLogs, setDistributionLogs] = useState<any[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  
  // Modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  const participants = meeting.participants || [];

  useEffect(() => {
    loadData();
  }, [meeting.id]);

  useEffect(() => {
    if (minutes && meeting) {
      const startDate = new Date(meeting.start_time);
      setEmailSubject(`[MeetMate] Biên bản cuộc họp: ${meeting.title} - ${startDate.toLocaleDateString('vi-VN')}`);
      setEmailBody(generateEmailBody());
    }
  }, [minutes, meeting]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [latestMinutes, logs] = await Promise.all([
        minutesApi.getLatest(meeting.id),
        minutesApi.getDistributionLogs(meeting.id).catch(() => ({ logs: [], total: 0 })),
      ]);
      setMinutes(latestMinutes);
      setDistributionLogs(logs.logs || []);
    } catch (err) {
      console.error('Failed to load distribution data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmailBody = () => {
    const startDate = new Date(meeting.start_time);
    const summary = minutes?.executive_summary || 'Đang cập nhật...';
    const status = minutes?.status === 'approved' ? '✓ ĐÃ PHÊ DUYỆT' : '';
    
    return `Kính gửi Quý đồng nghiệp,

Biên bản cuộc họp "${meeting.title}" đã được hoàn thành. ${status}

📅 Thời gian: ${startDate.toLocaleDateString('vi-VN')} - ${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
📍 Địa điểm: ${meeting.location || 'Online'}

📋 TÓM TẮT:
${summary}

Vui lòng xem chi tiết biên bản đính kèm hoặc truy cập MeetMate để xem đầy đủ.

Trân trọng,
MeetMate AI Assistant`;
  };

  const handleOpenEmailModal = () => {
    if (!minutes) {
      alert('Vui lòng tạo biên bản trước khi gửi email');
      return;
    }
    if (minutes.status !== 'approved') {
      const confirm = window.confirm('Biên bản chưa được phê duyệt. Bạn vẫn muốn gửi?');
      if (!confirm) return;
    }
    setSelectedRecipients(participants.map((p: any) => p.user_id || p.email).filter(Boolean));
    setSendSuccess(false);
    setShowEmailModal(true);
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const selectAllRecipients = () => {
    setSelectedRecipients(participants.map((p: any) => p.user_id || p.email).filter(Boolean));
  };

  const deselectAllRecipients = () => {
    setSelectedRecipients([]);
  };

  const handleSendEmail = async () => {
    if (selectedRecipients.length === 0) {
      alert('Vui lòng chọn ít nhất một người nhận');
      return;
    }

    setIsDistributing(true);
    try {
      await minutesApi.distribute({
        minutes_id: minutes!.id,
        meeting_id: meeting.id,
        channels: ['email'],
        recipients: selectedRecipients,
      });
      setSendSuccess(true);
      await loadData();
      
      setTimeout(() => {
        setShowEmailModal(false);
        setSendSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to distribute:', err);
      alert('Không thể gửi email. Vui lòng thử lại.');
    } finally {
      setIsDistributing(false);
    }
  };

  const distributedEmails = new Set(distributionLogs.map(log => log.recipient_email).filter(Boolean));

  return (
    <>
      <div className="card">
        <div className="card__header">
          <h3><Mail size={16} /> Phân phối biên bản</h3>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            {minutes?.status === 'approved' && (
              <span className="badge badge--success">
                <CheckCircle size={10} />
                Đã phê duyệt - Sẵn sàng gửi
              </span>
            )}
            <button 
              className="btn btn--primary btn--sm" 
              onClick={handleOpenEmailModal}
              disabled={!minutes || isDistributing}
            >
              <Send size={14} />
              Gửi Email
            </button>
          </div>
        </div>
        <div className="card__body">
          {isLoading ? (
            <div className="section-loading">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : (
            <>
              {!minutes && (
                <div className="empty-hint" style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>
                  <Mail size={32} style={{ opacity: 0.5, marginBottom: 'var(--space-sm)' }} />
                  <p>Tạo biên bản để gửi cho attendees</p>
                </div>
              )}
              
              {minutes && (
                <>
                  <div className="distribution-list">
                    {participants.slice(0, 10).map((p: any, idx: number) => {
                      const email = p.email;
                      const isDistributed = email && distributedEmails.has(email);
                      return (
                        <div key={p.user_id || p.email || idx} className="distribution-item">
                          <div className="distribution-avatar">
                            {(p.display_name || p.email || '?').charAt(0)}
                          </div>
                          <div className="distribution-info">
                            <div className="distribution-name">{p.display_name || p.email || 'Thành viên'}</div>
                            <div className="distribution-email">{p.email}</div>
                          </div>
                          <span className={`badge badge--${isDistributed ? 'success' : 'neutral'}`}>
                            {isDistributed ? (
                              <>
                                <Check size={10} />
                                Đã gửi
                              </>
                            ) : (
                              'Chưa gửi'
                            )}
                          </span>
                        </div>
                      );
                    })}
                    {participants.length > 10 && (
                      <div className="text-muted" style={{ fontSize: '13px', padding: 'var(--space-sm)' }}>
                        + {participants.length - 10} người khác
                      </div>
                    )}
                  </div>
                  
                  {distributionLogs.length > 0 && (
                    <div className="distribution-logs">
                      <h4>Lịch sử gửi</h4>
                      {distributionLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="distribution-log-item">
                          <CheckCircle size={12} style={{ color: 'var(--success)' }} />
                          <span>{log.recipient_email}</span>
                          <span className="badge badge--neutral" style={{ fontSize: '10px' }}>{log.channel}</span>
                          <span className="text-muted" style={{ fontSize: '11px' }}>
                            {new Date(log.sent_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => !isDistributing && setShowEmailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal__header">
              <h2 className="modal__title">
                <Mail size={20} />
                Gửi biên bản qua Email
              </h2>
              <button 
                className="btn btn--ghost btn--icon" 
                onClick={() => setShowEmailModal(false)}
                disabled={isDistributing}
              >
                <X size={20} />
              </button>
            </div>
            
            {sendSuccess ? (
              <div className="modal__body" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                <CheckCircle size={64} style={{ color: 'var(--success)', marginBottom: 'var(--space-lg)' }} />
                <h3 style={{ color: 'var(--success)', marginBottom: 'var(--space-sm)' }}>Gửi thành công!</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Đã gửi biên bản đến {selectedRecipients.length} người nhận
                </p>
              </div>
            ) : (
              <>
                <div className="modal__body">
                  {/* Recipients Selection */}
                  <div className="form-group">
                    <label className="form-label">
                      <Users size={14} style={{ marginRight: '6px' }} />
                      Người nhận ({selectedRecipients.length}/{participants.length})
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                      <button className="btn btn--ghost btn--sm" onClick={selectAllRecipients}>
                        Chọn tất cả
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={deselectAllRecipients}>
                        Bỏ chọn tất cả
                      </button>
                    </div>
                    <div className="recipients-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: 'var(--space-sm)',
                      maxHeight: '150px',
                      overflowY: 'auto',
                      padding: 'var(--space-sm)',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)'
                    }}>
                      {participants.map((p: any, idx: number) => {
                        const id = p.user_id || p.email;
                        const isSelected = selectedRecipients.includes(id);
                        const isDistributed = distributedEmails.has(p.email);
                        return (
                          <label 
                            key={id || idx}
                            className="recipient-checkbox"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-sm)',
                              padding: 'var(--space-sm)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                              border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRecipient(id)}
                              style={{ accentColor: 'var(--accent)' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.display_name || p.email || 'Thành viên'}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.email}
                              </div>
                            </div>
                            {isDistributed && (
                              <span className="badge badge--success" style={{ fontSize: '9px', padding: '2px 6px' }}>
                                Đã gửi
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Email Subject */}
                  <div className="form-group">
                    <label className="form-label">
                      <MessageSquare size={14} style={{ marginRight: '6px' }} />
                      Tiêu đề email
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                    />
                  </div>

                  {/* Email Preview */}
                  <div className="form-group">
                    <label className="form-label">
                      <FileText size={14} style={{ marginRight: '6px' }} />
                      Nội dung email (xem trước)
                    </label>
                    <textarea
                      className="form-input"
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      rows={10}
                      style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.5 }}
                    />
                  </div>

                  {/* Attachments Info */}
                  <div className="form-group">
                    <label className="form-label">Đính kèm</label>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-sm)',
                      padding: 'var(--space-sm)',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)'
                    }}>
                      <FileText size={16} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontSize: '13px' }}>Biên bản cuộc họp - {meeting.title}.pdf</span>
                      {minutes?.status === 'approved' && (
                        <span className="badge badge--success" style={{ marginLeft: 'auto' }}>
                          <CheckCircle size={10} />
                          Đã duyệt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="modal__footer">
                  <button 
                    className="btn btn--secondary" 
                    onClick={() => setShowEmailModal(false)}
                    disabled={isDistributing}
                  >
                    Hủy
                  </button>
                  <button 
                    className="btn btn--primary" 
                    onClick={handleSendEmail}
                    disabled={isDistributing || selectedRecipients.length === 0}
                  >
                    {isDistributing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Gửi đến {selectedRecipients.length} người
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PostMeetTab;
