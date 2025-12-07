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

// Summary Section with Minutes Generation
const SummarySection = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError('Không thể tải biên bản');
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
      console.error('Failed to generate minutes:', err);
      setError('Không thể tạo biên bản. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySummary = () => {
    if (minutes?.executive_summary) {
      navigator.clipboard.writeText(minutes.executive_summary);
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('Tính năng export PDF đang được phát triển');
  };

  const displayContent = minutes?.executive_summary || minutes?.minutes_markdown || 'Chưa có biên bản. Nhấn "AI Tạo biên bản" để tạo.';

  return (
    <div className="summary-section">
      <div className="summary-header">
        <h3><FileText size={18} /> Executive Summary</h3>
        <div className="summary-actions">
          <button 
            className="btn btn--secondary btn--sm" 
            onClick={handleGenerateMinutes} 
            disabled={isGenerating || isLoading}
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI Tạo biên bản
          </button>
          {minutes && (
            <>
              <button className="btn btn--secondary btn--sm" onClick={handleCopySummary}>
                <Copy size={14} />
                Copy
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleExportPDF}>
                <Download size={14} />
                Export PDF
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
            <Loader2 size={20} className="animate-spin" />
            <span>Đang tải...</span>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="minutes-content">
            {minutes?.minutes_markdown ? (
              <div dangerouslySetInnerHTML={{ __html: formatMarkdown(minutes.minutes_markdown) }} />
            ) : (
              <p style={{ whiteSpace: 'pre-wrap' }}>{displayContent}</p>
            )}
            {minutes && (
              <div className="minutes-meta">
                <span>Version {minutes.version}</span>
                <span className={`badge badge--${minutes.status === 'approved' ? 'success' : 'neutral'}`}>
                  {minutes.status}
                </span>
                {minutes.generated_at && (
                  <span>Tạo lúc: {new Date(minutes.generated_at).toLocaleString('vi-VN')}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
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
