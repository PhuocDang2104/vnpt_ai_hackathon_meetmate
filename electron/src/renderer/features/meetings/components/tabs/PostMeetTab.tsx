import { useState } from 'react';
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
  Play,
  Sparkles,
  Loader2,
  Copy,
} from 'lucide-react';
import type { MeetingWithParticipants } from '../../../../shared/dto/meeting';
import { aiApi } from '../../../../lib/api/ai';

interface PostMeetTabProps {
  meeting: MeetingWithParticipants;
  onRefresh: () => void;
}

export const PostMeetTab = ({ meeting, onRefresh }: PostMeetTabProps) => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  return (
    <div className="postmeet-tab">
      {/* Summary Section */}
      <SummarySection meeting={meeting} />

      {/* Stats Row */}
      <div className="postmeet-stats">
        <div className="stat-card stat-card--accent">
          <CheckSquare size={20} />
          <div className="stat-card__content">
            <span className="stat-card__value">3</span>
            <span className="stat-card__label">Action Items</span>
          </div>
        </div>
        <div className="stat-card stat-card--success">
          <FileText size={20} />
          <div className="stat-card__content">
            <span className="stat-card__value">2</span>
            <span className="stat-card__label">Quyết định</span>
          </div>
        </div>
        <div className="stat-card stat-card--warning">
          <AlertTriangle size={20} />
          <div className="stat-card__content">
            <span className="stat-card__value">1</span>
            <span className="stat-card__label">Rủi ro</span>
          </div>
        </div>
        <div className="stat-card stat-card--info">
          <Clock size={20} />
          <div className="stat-card__content">
            <span className="stat-card__value">55</span>
            <span className="stat-card__label">Phút</span>
          </div>
        </div>
      </div>

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

// Summary Section
const SummarySection = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(`Dự án Core Banking đạt **68% tiến độ**. Module Account Management đã hoàn thành UAT. 
  
Đã phê duyệt điều chuyển **2 senior developers** từ team Mobile để hỗ trợ optimization. 

Có **3 action items** được giao với deadline trong tuần. **1 risk** cao được identify và đã có mitigation plan.`);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const result = await aiApi.generateSummary(meeting.id, 'Sample transcript...');
      if (result.summary) {
        setSummary(result.summary);
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="summary-section">
      <div className="summary-header">
        <h3><FileText size={18} /> Executive Summary</h3>
        <div className="summary-actions">
          <button className="btn btn--secondary btn--sm" onClick={handleGenerateSummary} disabled={isGenerating}>
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI Tạo tóm tắt
          </button>
          <button className="btn btn--secondary btn--sm">
            <Copy size={14} />
            Copy
          </button>
          <button className="btn btn--primary btn--sm">
            <Download size={14} />
            Export PDF
          </button>
        </div>
      </div>
      <div className="summary-content">
        <p>{summary}</p>
      </div>
    </div>
  );
};

// Action Items Section
const ActionItemsSection = ({ meetingId }: { meetingId: string }) => {
  const actions = [
    { id: '1', text: 'Gửi updated roadmap Sprint 24-25', owner: 'Ngô Thị F', deadline: '07/12/2024', priority: 'high', status: 'confirmed' },
    { id: '2', text: 'Coordinate điều chuyển developers với HR', owner: 'Trần Thị B', deadline: '09/12/2024', priority: 'critical', status: 'in_progress' },
    { id: '3', text: 'Gửi Penetration Test Report', owner: 'Hoàng Thị E', deadline: '10/12/2024', priority: 'high', status: 'confirmed' },
  ];

  return (
    <div className="card">
      <div className="card__header">
        <h3><CheckSquare size={16} /> Action Items</h3>
      </div>
      <div className="card__body">
        <div className="action-list">
          {actions.map(action => (
            <div key={action.id} className="action-row">
              <div className={`action-checkbox ${action.status === 'completed' ? 'action-checkbox--checked' : ''}`}>
                {action.status === 'completed' && <Check size={12} />}
              </div>
              <div className="action-content">
                <div className="action-text">{action.text}</div>
                <div className="action-meta">
                  <span className={`badge badge--${action.priority === 'critical' ? 'error' : action.priority === 'high' ? 'warning' : 'neutral'}`}>
                    {action.priority}
                  </span>
                  <span className="action-meta-item">
                    <User size={12} />
                    {action.owner}
                  </span>
                  <span className="action-meta-item">
                    <Clock size={12} />
                    {action.deadline}
                  </span>
                </div>
              </div>
              <button className="btn btn--ghost btn--icon btn--sm">
                <ExternalLink size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Decisions Section
const DecisionsSection = ({ meetingId }: { meetingId: string }) => {
  const decisions = [
    { id: '1', text: 'Approve điều chuyển 2 senior developers từ team Mobile sang Core Banking trong 4 tuần', confirmedBy: 'Vũ Văn G', rationale: 'Để đảm bảo timeline go-live 01/01' },
    { id: '2', text: 'Team Mobile sẽ adjust scope Sprint 24', confirmedBy: 'Nguyễn Văn A', rationale: 'Trade-off để support Core Banking' },
  ];

  return (
    <div className="card">
      <div className="card__header">
        <h3><FileText size={16} /> Quyết định</h3>
      </div>
      <div className="card__body">
        <div className="decision-list">
          {decisions.map((dec, index) => (
            <div key={dec.id} className="decision-item">
              <div className="decision-header">
                <span className="badge badge--success">QĐ-{String(index + 1).padStart(3, '0')}</span>
                <span className="decision-confirmer">
                  <Check size={12} />
                  {dec.confirmedBy}
                </span>
              </div>
              <div className="decision-text">{dec.text}</div>
              <div className="decision-rationale">{dec.rationale}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Risks Section
const RisksSection = ({ meetingId }: { meetingId: string }) => {
  const risks = [
    { id: '1', text: 'Go-live Core Banking có thể delay 2 tuần nếu không có đủ resources', severity: 'high', mitigation: 'Đã approve điều chuyển developers', status: 'mitigated' },
    { id: '2', text: '3 medium security issues từ Penetration Test chưa fix', severity: 'medium', mitigation: 'Team đang fix, target trước go-live', status: 'in_progress' },
  ];

  return (
    <div className="card">
      <div className="card__header">
        <h3><AlertTriangle size={16} /> Rủi ro đã nhận diện</h3>
      </div>
      <div className="card__body">
        <div className="risk-grid">
          {risks.map((risk, index) => (
            <div key={risk.id} className={`risk-card risk-card--${risk.severity}`}>
              <div className="risk-header">
                <span className="risk-id">R-{String(index + 1).padStart(3, '0')}</span>
                <span className={`badge badge--${risk.severity === 'high' ? 'error' : 'warning'}`}>
                  {risk.severity}
                </span>
              </div>
              <div className="risk-text">{risk.text}</div>
              <div className="risk-mitigation">
                <strong>Mitigation:</strong> {risk.mitigation}
              </div>
              <span className={`badge badge--${risk.status === 'mitigated' ? 'success' : 'info'}`}>
                {risk.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Distribution Section
const DistributionSection = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const participants = meeting.participants || [];
  
  return (
    <div className="card">
      <div className="card__header">
        <h3><Mail size={16} /> Phân phối biên bản</h3>
        <button className="btn btn--primary btn--sm">
          <Share2 size={14} />
          Gửi MoM
        </button>
      </div>
      <div className="card__body">
        <div className="distribution-list">
          {participants.slice(0, 5).map((p: any, idx: number) => (
            <div key={p.user_id || p.email || idx} className="distribution-item">
              <div className="distribution-avatar">
                {(p.display_name || p.email || '?').charAt(0)}
              </div>
              <div className="distribution-info">
                <div className="distribution-name">{p.display_name || p.email || 'Thành viên'}</div>
                <div className="distribution-email">{p.email}</div>
              </div>
              <span className="badge badge--success">
                <Check size={10} />
                Sẽ nhận
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostMeetTab;

