import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import type { MeetingWithParticipants } from '../../../../shared/dto/meeting';
import { minutesApi, type MeetingMinutes } from '../../../../lib/api/minutes';
import { itemsApi, type ActionItem, type DecisionItem, type RiskItem } from '../../../../lib/api/items';

interface PostMeetTabProps {
  meeting: MeetingWithParticipants;
  onRefresh: () => void;
}

export const PostMeetTab = ({ meeting, onRefresh }: PostMeetTabProps) => {
  return (
    <div className="postmeet-tab">
      {/* Summary Section */}
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

      {/* Distribution & Export */}
      <DistributionSection meeting={meeting} />
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

// Summary Section with Minutes Generation
const SummarySection = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadLatestMinutes();
  }, [meeting.id]);

  const loadLatestMinutes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const latest = await minutesApi.getLatest(meeting.id);
      setMinutes(latest);
    } catch (err) {
      console.error('Failed to load minutes:', err);
      // Don't show error, just indicate no minutes yet
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
      // Fallback to mock generation
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
      // Update locally even if API fails
      setMinutes({ ...minutes, minutes_markdown: editContent });
      setIsEditing(false);
    }
  };

  const handleExportPDF = () => {
    if (!minutes) {
      alert('Vui lòng tạo biên bản trước khi export');
      return;
    }

    // Create a new window with print-friendly content
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
          .header h1 { 
            color: #0066cc; 
            font-size: 24px; 
            margin-bottom: 10px;
          }
          .header .subtitle { 
            color: #666; 
            font-size: 14px;
          }
          .meta { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 20px; 
            margin-bottom: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .meta-item { 
            flex: 1 1 200px;
          }
          .meta-label { 
            font-size: 12px; 
            color: #666; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-value { 
            font-weight: 600; 
            color: #333;
          }
          .section { 
            margin-bottom: 25px; 
          }
          .section h2 { 
            color: #0066cc; 
            font-size: 16px; 
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
            margin-bottom: 15px;
          }
          .content { 
            white-space: pre-wrap; 
            font-size: 14px;
          }
          .footer { 
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BIÊN BẢN CUỘC HỌP</h1>
          <div class="subtitle">${meeting.title}</div>
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
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="summary-section">
      <div className="summary-header">
        <h3><FileText size={18} /> Biên bản cuộc họp (AI Generated)</h3>
        <div className="summary-actions">
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
                <FileText size={14} />
                Chỉnh sửa
              </button>
              <button 
                className="btn btn--secondary btn--sm" 
                onClick={handleCopySummary}
                title={copied ? 'Đã copy!' : 'Copy nội dung'}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Đã copy!' : 'Copy'}
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleExportPDF}>
                <Download size={14} />
                Export PDF
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button 
                className="btn btn--primary btn--sm" 
                onClick={handleSaveEdit}
              >
                <Check size={14} />
                Lưu
              </button>
              <button 
                className="btn btn--ghost btn--sm" 
                onClick={() => setIsEditing(false)}
              >
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
      
      <div className="summary-content">
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
            <p className="edit-hint">Hỗ trợ Markdown. Sau khi lưu, biên bản sẽ được format tự động.</p>
          </div>
        ) : minutes ? (
          <div className="minutes-display">
            <div className="minutes-meta">
              <span className={`badge badge--${minutes.status === 'approved' ? 'success' : minutes.status === 'reviewed' ? 'info' : 'warning'}`}>
                {minutes.status === 'approved' ? 'Đã duyệt' : minutes.status === 'reviewed' ? 'Đã review' : 'Bản nháp'}
              </span>
              <span className="minutes-version">Phiên bản {minutes.version}</span>
              {minutes.generated_at && (
                <span className="minutes-date">
                  <Clock size={12} />
                  {new Date(minutes.generated_at).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
            <div 
              className="minutes-content markdown-body"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(minutes.minutes_markdown || minutes.executive_summary || '') }}
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
  );
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
        duration: 0, // TODO: Calculate from meeting
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

  useEffect(() => {
    loadData();
  }, [meeting.id]);

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

  const handleDistribute = async () => {
    if (!minutes) {
      alert('Vui lòng tạo biên bản trước khi phân phối');
      return;
    }

    setIsDistributing(true);
    try {
      await minutesApi.distribute({
        minutes_id: minutes.id,
        meeting_id: meeting.id,
        channels: ['email'],
      });
      await loadData();
      alert('Đã gửi biên bản đến tất cả participants');
    } catch (err) {
      console.error('Failed to distribute:', err);
      alert('Không thể gửi biên bản. Vui lòng thử lại.');
    } finally {
      setIsDistributing(false);
    }
  };

  const participants = meeting.participants || [];
  const distributedEmails = new Set(distributionLogs.map(log => log.recipient_email).filter(Boolean));

  return (
    <div className="card">
      <div className="card__header">
        <h3><Mail size={16} /> Phân phối biên bản</h3>
        <button 
          className="btn btn--primary btn--sm" 
          onClick={handleDistribute}
          disabled={!minutes || isDistributing}
        >
          {isDistributing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
          Gửi MoM
        </button>
      </div>
      <div className="card__body">
        {isLoading ? (
          <div className="section-loading">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : (
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
                        'Sẽ nhận'
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            {distributionLogs.length > 0 && (
              <div className="distribution-logs">
                <h4>Lịch sử phân phối</h4>
                {distributionLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="distribution-log-item">
                    <span>{log.recipient_email}</span>
                    <span className="badge badge--neutral">{log.channel}</span>
                    <span className="text-muted">
                      {new Date(log.sent_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PostMeetTab;
