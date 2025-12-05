import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Sparkles,
  MessageSquare,
  Settings,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';
import { meetingsApi } from '../../../lib/api/meetings';
import type { MeetingWithParticipants } from '../../../shared/dto/meeting';
import { MEETING_TYPE_LABELS, MEETING_PHASE_LABELS } from '../../../shared/dto/meeting';
import { ParticipantsPanel } from './ParticipantsPanel';
import { AgendaPanel } from './AgendaPanel';
import { DocumentsPanel } from './DocumentsPanel';
import { AIAssistantPanel } from './AIAssistantPanel';

type TabType = 'overview' | 'participants' | 'agenda' | 'documents' | 'ai';

export const MeetingDetail = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  
  const [meeting, setMeeting] = useState<MeetingWithParticipants | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const fetchMeeting = useCallback(async () => {
    if (!meetingId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await meetingsApi.get(meetingId);
      setMeeting(data);
    } catch (err) {
      console.error('Failed to fetch meeting:', err);
      setError('Không thể tải thông tin cuộc họp');
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  const handleStartMeeting = async () => {
    if (!meetingId) return;
    try {
      await meetingsApi.updatePhase(meetingId, 'in');
      navigate(`/live/${meetingId}`);
    } catch (err) {
      console.error('Failed to start meeting:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="form-loading" style={{ padding: 'var(--space-2xl)' }}>
        <div className="spinner" style={{ width: 32, height: 32 }}></div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="empty-state">
        <AlertCircle className="empty-state__icon" />
        <h3 className="empty-state__title">{error || 'Không tìm thấy cuộc họp'}</h3>
        <button className="btn btn--secondary" onClick={() => navigate('/meetings')}>
          Quay lại
        </button>
      </div>
    );
  }

  const startTime = meeting.start_time ? new Date(meeting.start_time) : null;
  const endTime = meeting.end_time ? new Date(meeting.end_time) : null;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Tổng quan', icon: <FileText size={16} /> },
    { id: 'participants', label: 'Thành viên', icon: <Users size={16} /> },
    { id: 'agenda', label: 'Chương trình', icon: <Calendar size={16} /> },
    { id: 'documents', label: 'Tài liệu', icon: <FileText size={16} /> },
    { id: 'ai', label: 'AI Assistant', icon: <Sparkles size={16} /> },
  ];

  return (
    <div className="meeting-detail">
      {/* Header */}
      <div className="meeting-detail__header">
        <button className="btn btn--ghost" onClick={() => navigate('/meetings')}>
          <ArrowLeft size={18} />
        </button>
        
        <div className="meeting-detail__header-content">
          <div className="meeting-detail__header-top">
            <span className={`meeting-item__phase meeting-item__phase--${meeting.phase}`}>
              {MEETING_PHASE_LABELS[meeting.phase]}
            </span>
            <span className="meeting-detail__type">
              {MEETING_TYPE_LABELS[meeting.meeting_type]}
            </span>
          </div>
          <h1 className="meeting-detail__title">{meeting.title}</h1>
          {meeting.description && (
            <p className="meeting-detail__description">{meeting.description}</p>
          )}
        </div>

        <div className="meeting-detail__header-actions">
          <button className="btn btn--secondary" onClick={fetchMeeting}>
            <RefreshCw size={16} />
          </button>
          {meeting.phase === 'pre' && (
            <button className="btn btn--primary" onClick={handleStartMeeting}>
              <Play size={16} />
              Bắt đầu họp
            </button>
          )}
          {meeting.phase === 'in' && (
            <button className="btn btn--accent" onClick={() => navigate(`/live/${meetingId}`)}>
              <Play size={16} />
              Vào phòng họp
            </button>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="meeting-detail__meta">
        {startTime && (
          <div className="meeting-detail__meta-item">
            <Calendar size={16} />
            <span>
              {startTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
        )}
        {startTime && endTime && (
          <div className="meeting-detail__meta-item">
            <Clock size={16} />
            <span>
              {startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        {meeting.location && (
          <div className="meeting-detail__meta-item">
            <MapPin size={16} />
            <span>{meeting.location}</span>
          </div>
        )}
        {meeting.teams_link && (
          <div className="meeting-detail__meta-item">
            <LinkIcon size={16} />
            <a href={meeting.teams_link} target="_blank" rel="noopener noreferrer">
              Tham gia Teams
            </a>
          </div>
        )}
        <div className="meeting-detail__meta-item">
          <Users size={16} />
          <span>{meeting.participants?.length || 0} thành viên</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="meeting-detail__tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`meeting-detail__tab ${activeTab === tab.id ? 'meeting-detail__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="meeting-detail__content">
        {activeTab === 'overview' && (
          <OverviewPanel meeting={meeting} />
        )}
        {activeTab === 'participants' && (
          <ParticipantsPanel meetingId={meetingId!} participants={meeting.participants || []} onUpdate={fetchMeeting} />
        )}
        {activeTab === 'agenda' && (
          <AgendaPanel meetingId={meetingId!} meetingType={meeting.meeting_type} />
        )}
        {activeTab === 'documents' && (
          <DocumentsPanel meetingId={meetingId!} />
        )}
        {activeTab === 'ai' && (
          <AIAssistantPanel meetingId={meetingId!} />
        )}
      </div>
    </div>
  );
};

// Overview Panel Component
const OverviewPanel = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  return (
    <div className="overview-panel">
      <div className="overview-grid">
        {/* Quick Stats */}
        <div className="card">
          <h3 className="card__title">Thống kê nhanh</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-item__value">{meeting.participants?.length || 0}</span>
              <span className="stat-item__label">Thành viên</span>
            </div>
            <div className="stat-item">
              <span className="stat-item__value">0</span>
              <span className="stat-item__label">Tài liệu</span>
            </div>
            <div className="stat-item">
              <span className="stat-item__value">0</span>
              <span className="stat-item__label">Action Items</span>
            </div>
          </div>
        </div>

        {/* Meeting Info */}
        <div className="card">
          <h3 className="card__title">Thông tin cuộc họp</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="info-item__label">Loại cuộc họp</span>
              <span className="info-item__value">{MEETING_TYPE_LABELS[meeting.meeting_type]}</span>
            </div>
            <div className="info-item">
              <span className="info-item__label">Trạng thái</span>
              <span className="info-item__value">{MEETING_PHASE_LABELS[meeting.phase]}</span>
            </div>
            <div className="info-item">
              <span className="info-item__label">Tạo lúc</span>
              <span className="info-item__value">
                {meeting.created_at ? new Date(meeting.created_at).toLocaleString('vi-VN') : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card card--full">
          <h3 className="card__title">Hoạt động gần đây</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-item__icon">
                <CheckCircle size={16} />
              </div>
              <div className="activity-item__content">
                <span className="activity-item__text">Cuộc họp đã được tạo</span>
                <span className="activity-item__time">
                  {meeting.created_at ? new Date(meeting.created_at).toLocaleString('vi-VN') : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetail;

