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
  Mic,
  CheckSquare,
  Play,
  AlertCircle,
  RefreshCw,
  Link as LinkIcon,
  Video,
} from 'lucide-react';
import { meetingsApi } from '../../../lib/api/meetings';
import type { MeetingWithParticipants } from '../../../shared/dto/meeting';
import { MEETING_TYPE_LABELS, MEETING_PHASE_LABELS } from '../../../shared/dto/meeting';

// Tab Components
import { PreMeetTab } from './tabs/PreMeetTab';
import { InMeetTab } from './tabs/InMeetTab';
import { PostMeetTab } from './tabs/PostMeetTab';

type MeetingTabType = 'pre' | 'in' | 'post';

export const MeetingDetail = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  
  const [meeting, setMeeting] = useState<MeetingWithParticipants | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MeetingTabType>('pre');

  const fetchMeeting = useCallback(async () => {
    if (!meetingId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await meetingsApi.get(meetingId);
      setMeeting(data);
      // Set active tab based on meeting phase
      if (data.phase === 'in') setActiveTab('in');
      else if (data.phase === 'post') setActiveTab('post');
      else setActiveTab('pre');
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
      setActiveTab('in');
      fetchMeeting();
    } catch (err) {
      console.error('Failed to start meeting:', err);
    }
  };

  const handleEndMeeting = async () => {
    if (!meetingId) return;
    try {
      await meetingsApi.updatePhase(meetingId, 'post');
      setActiveTab('post');
      fetchMeeting();
    } catch (err) {
      console.error('Failed to end meeting:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="meeting-detail-loading">
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
        <p>Đang tải thông tin cuộc họp...</p>
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

  const tabs: { id: MeetingTabType; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'pre', label: 'Chuẩn bị', icon: <FileText size={18} />, description: 'Agenda, Tài liệu, Thành viên' },
    { id: 'in', label: 'Trong họp', icon: <Mic size={18} />, description: 'Transcript, Actions, Decisions' },
    { id: 'post', label: 'Sau họp', icon: <CheckSquare size={18} />, description: 'Summary, MoM, Follow-up' },
  ];

  return (
    <div className="meeting-detail-v2">
      {/* Compact Header */}
      <header className="meeting-detail-v2__header">
        <div className="meeting-detail-v2__header-left">
          <button className="btn btn--ghost btn--icon" onClick={() => navigate('/meetings')}>
            <ArrowLeft size={20} />
          </button>
          <div className="meeting-detail-v2__header-info">
            <div className="meeting-detail-v2__header-badges">
              <span className={`badge badge--${meeting.phase === 'in' ? 'accent' : meeting.phase === 'post' ? 'success' : 'info'}`}>
                {meeting.phase === 'in' && <span className="live-dot"></span>}
                {MEETING_PHASE_LABELS[meeting.phase]}
              </span>
              <span className="badge badge--neutral">{MEETING_TYPE_LABELS[meeting.meeting_type]}</span>
            </div>
            <h1 className="meeting-detail-v2__title">{meeting.title}</h1>
          </div>
        </div>
        
        <div className="meeting-detail-v2__header-right">
          <div className="meeting-detail-v2__meta-compact">
            {startTime && (
              <>
                <span className="meta-item">
                  <Calendar size={14} />
                  {startTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                </span>
                <span className="meta-item">
                  <Clock size={14} />
                  {startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
            <span className="meta-item">
              <Users size={14} />
              {meeting.participants?.length || 0}
            </span>
          </div>
          
          <div className="meeting-detail-v2__actions">
            <button className="btn btn--ghost btn--icon" onClick={fetchMeeting} title="Làm mới">
              <RefreshCw size={18} />
            </button>
            
            {meeting.teams_link && (
              <a href={meeting.teams_link} target="_blank" rel="noopener noreferrer" className="btn btn--secondary">
                <Video size={16} />
                Teams
              </a>
            )}
            
            {meeting.phase === 'pre' && (
              <button className="btn btn--primary" onClick={handleStartMeeting}>
                <Play size={16} />
                Bắt đầu họp
              </button>
            )}
            
            {meeting.phase === 'in' && (
              <button className="btn btn--accent" onClick={handleEndMeeting}>
                <CheckSquare size={16} />
                Kết thúc
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Phase Tabs - 3 Main Tabs */}
      <nav className="meeting-detail-v2__tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            className={`phase-tab ${activeTab === tab.id ? 'phase-tab--active' : ''} ${meeting.phase === tab.id ? 'phase-tab--current' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <div className="phase-tab__number">{index + 1}</div>
            <div className="phase-tab__content">
              <div className="phase-tab__icon">{tab.icon}</div>
              <div className="phase-tab__text">
                <span className="phase-tab__label">{tab.label}</span>
                <span className="phase-tab__desc">{tab.description}</span>
              </div>
            </div>
            {meeting.phase === tab.id && (
              <div className="phase-tab__indicator">
                {tab.id === 'in' ? 'LIVE' : 'Hiện tại'}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="meeting-detail-v2__content">
        {activeTab === 'pre' && (
          <PreMeetTab 
            meeting={meeting} 
            onRefresh={fetchMeeting}
          />
        )}
        {activeTab === 'in' && (
          <InMeetTab 
            meeting={meeting}
            onRefresh={fetchMeeting}
            onEndMeeting={handleEndMeeting}
          />
        )}
        {activeTab === 'post' && (
          <PostMeetTab 
            meeting={meeting}
            onRefresh={fetchMeeting}
          />
        )}
      </main>
    </div>
  );
};

export default MeetingDetail;
