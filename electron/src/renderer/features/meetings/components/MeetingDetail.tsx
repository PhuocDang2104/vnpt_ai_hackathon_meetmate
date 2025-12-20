import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Mic,
  CheckSquare,
  Play,
  AlertCircle,
  RefreshCw,
  Link as LinkIcon,
  Video,
  Edit2,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { meetingsApi } from '../../../lib/api/meetings';
import { sessionsApi } from '../../../lib/api/sessions';
import { inMeetingApi } from '../../../lib/api/inMeeting';
import type { MeetingWithParticipants, MeetingUpdate } from '../../../shared/dto/meeting';
import { MEETING_TYPE_LABELS, MEETING_PHASE_LABELS } from '../../../shared/dto/meeting';
import { USE_API } from '../../../config/env';

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
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinPlatform, setJoinPlatform] = useState<'gomeet' | 'gmeet'>('gomeet');
  const [gmeetJoinLink, setGmeetJoinLink] = useState('');
  const [gomeetFullJoinUrl, setGomeetFullJoinUrl] = useState('');
  const [gomeetHostUrl, setGomeetHostUrl] = useState('');
  const [gomeetMeetingSecretKey, setGomeetMeetingSecretKey] = useState('');
  const [gomeetAccessCode, setGomeetAccessCode] = useState('');
  const [streamSessionId, setStreamSessionId] = useState<string | null>(null);
  const [audioIngestToken, setAudioIngestToken] = useState('');
  const [sessionInitError, setSessionInitError] = useState<string | null>(null);
  const [isInitSessionLoading, setIsInitSessionLoading] = useState(false);
  const [gomeetInitError, setGomeetInitError] = useState<string | null>(null);
  const [isGoMeetLoading, setIsGoMeetLoading] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    teams_link: '',
    location: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMeeting = useCallback(async () => {
    if (!meetingId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await meetingsApi.get(meetingId);
      setMeeting(data);
      setStreamSessionId(data.id);
      setGmeetJoinLink(data.teams_link || '');
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

  const resolveJoinTarget = (preferredPlatform?: 'gomeet' | 'gmeet') => {
    const platform = preferredPlatform || joinPlatform;
    if (platform === 'gomeet' && gomeetFullJoinUrl) {
      return { link: gomeetFullJoinUrl, platform: 'gomeet' as const };
    }
    if (platform === 'gmeet' && gmeetJoinLink) {
      return { link: gmeetJoinLink, platform: 'gmeet' as const };
    }
    if (gomeetFullJoinUrl) {
      return { link: gomeetFullJoinUrl, platform: 'gomeet' as const };
    }
    if (gmeetJoinLink) {
      return { link: gmeetJoinLink, platform: 'gmeet' as const };
    }
    return { link: '', platform };
  };

  const openMeetingLink = (override?: {
    link?: string;
    platform?: 'gomeet' | 'gmeet';
    sessionId?: string;
    token?: string;
  }) => {
    if (!meeting) return;
    const resolved = resolveJoinTarget(override?.platform);
    const link = override?.link || resolved.link;
    const platform = override?.platform || resolved.platform || joinPlatform;
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
    setActiveTab('in');
    const params = new URLSearchParams();
    const session = override?.sessionId || streamSessionId || meeting.id;
    if (session) params.set('session', session);
    if (link) params.set('link', link);
    if (platform) params.set('platform', platform);
    const token = override?.token || audioIngestToken;
    if (token) params.set('token', token);
    const qs = params.toString();
    navigate(`/app/meetings/${meeting.id}/dock${qs ? `?${qs}` : ''}`);
  };

  const handleOpenMeetingLink = () => {
    openMeetingLink();
  };

  const handleInitRealtimeSession = async () => {
    if (!USE_API) {
      setShowJoinModal(false);
      return;
    }
    const desiredSessionId = streamSessionId || meeting?.id;
    if (!desiredSessionId) return;

    setIsInitSessionLoading(true);
    setSessionInitError(null);
    try {
      const res = await sessionsApi.create({
        session_id: desiredSessionId,
        language_code: 'vi-VN',
        target_sample_rate_hz: 16000,
        audio_encoding: 'PCM_S16LE',
        channels: 1,
        realtime: true,
        interim_results: true,
        enable_word_time_offsets: true,
      });
      const sessionId = res.session_id;
      setStreamSessionId(sessionId);

      let token = audioIngestToken.trim();
      if (!token) {
        const platform = joinPlatform === 'gomeet' ? 'vnpt_gomeet' : undefined;
        const tokenRes = await sessionsApi.registerSource(sessionId, platform);
        token = tokenRes.audio_ingest_token;
      }
      setAudioIngestToken(token);
      setShowJoinModal(false);
    } catch (err) {
      console.error('Failed to init realtime session:', err);
      setSessionInitError('Không thể khởi tạo realtime session. Kiểm tra backend /api/v1/sessions.');
    } finally {
      setIsInitSessionLoading(false);
    }
  };

  const handleLaunchGoMeet = async () => {
    if (!meeting) return;
    if (!USE_API) {
      setGomeetInitError('USE_API=false: không thể gọi backend để tạo GoMeet.');
      return;
    }
    const desiredSessionId = streamSessionId || meeting.id;
    if (!desiredSessionId) return;

    setIsGoMeetLoading(true);
    setGomeetInitError(null);
    try {
      const res = await sessionsApi.create({
        session_id: desiredSessionId,
        language_code: 'vi-VN',
        target_sample_rate_hz: 16000,
        audio_encoding: 'PCM_S16LE',
        channels: 1,
        realtime: true,
        interim_results: true,
        enable_word_time_offsets: true,
      });
      const sessionId = res.session_id;
      setStreamSessionId(sessionId);

      let token = audioIngestToken.trim();
      if (!token || sessionId !== desiredSessionId) {
        const tokenRes = await sessionsApi.registerSource(sessionId, 'vnpt_gomeet');
        token = tokenRes.audio_ingest_token;
      }
      setAudioIngestToken(token);

      const joinRes = await inMeetingApi.createGoMeetJoinUrl({
        session_id: sessionId,
        audio_ingest_token: token,
        meeting_secret_key: gomeetMeetingSecretKey.trim() || undefined,
        access_code: gomeetAccessCode.trim() || undefined,
      });

      setGomeetFullJoinUrl(joinRes.full_join_url);
      setGomeetHostUrl(joinRes.host_join_url || '');
      setShowJoinModal(false);
      openMeetingLink({ link: joinRes.full_join_url, platform: 'gomeet', sessionId, token });
    } catch (err) {
      console.error('Failed to start GoMeet flow:', err);
      setGomeetInitError('Không thể khởi tạo GoMeet. Kiểm tra token và cấu hình GoMeet API.');
    } finally {
      setIsGoMeetLoading(false);
    }
  };

  // Open edit modal with current meeting data
  const handleOpenEdit = () => {
    if (!meeting) return;
    
    // Format datetime for input fields
    const formatDateTimeLocal = (dateStr: string | undefined) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().slice(0, 16);
    };
    
    setEditForm({
      title: meeting.title || '',
      description: meeting.description || '',
      start_time: formatDateTimeLocal(meeting.start_time),
      end_time: formatDateTimeLocal(meeting.end_time),
      teams_link: meeting.teams_link || '',
      location: meeting.location || '',
    });
    setShowEditModal(true);
  };

  // Save edited meeting
  const handleSaveEdit = async () => {
    if (!meetingId) return;
    
    setIsSaving(true);
    try {
      const updateData: MeetingUpdate = {
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        start_time: editForm.start_time ? new Date(editForm.start_time).toISOString() : undefined,
        end_time: editForm.end_time ? new Date(editForm.end_time).toISOString() : undefined,
        teams_link: editForm.teams_link || undefined,
        location: editForm.location || undefined,
      };
      
      await meetingsApi.update(meetingId, updateData);
      setShowEditModal(false);
      fetchMeeting();
    } catch (err) {
      console.error('Failed to update meeting:', err);
      alert('Không thể cập nhật cuộc họp');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete meeting
  const handleDelete = async () => {
    if (!meetingId) return;
    
    setIsDeleting(true);
    try {
      await meetingsApi.delete(meetingId);
      navigate('/app/meetings');
    } catch (err) {
      console.error('Failed to delete meeting:', err);
      alert('Không thể xóa cuộc họp');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
        <button className="btn btn--secondary" onClick={() => navigate('/app/meetings')}>
          Quay lại
        </button>
      </div>
    );
  }

  const startTime = meeting.start_time ? new Date(meeting.start_time) : null;
  const endTime = meeting.end_time ? new Date(meeting.end_time) : null;
  
  // Determine if meeting is currently live based on time
  const now = new Date();
  const isLiveByTime = startTime && endTime && now >= startTime && now <= endTime;
  const isUpcoming = startTime && now < startTime;
  const isEnded = endTime && now > endTime;

  const tabs: { id: MeetingTabType; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'pre', label: 'Chuẩn bị', icon: <FileText size={18} />, description: 'Agenda, Tài liệu, Thành viên' },
    { id: 'in', label: 'Trong họp', icon: <Mic size={18} />, description: 'Transcript, Actions, Decisions' },
    { id: 'post', label: 'Sau họp', icon: <CheckSquare size={18} />, description: 'Summary, MoM, Follow-up' },
  ];
  const primaryJoinTarget = resolveJoinTarget();
  const inMeetingPlatform = primaryJoinTarget.platform || joinPlatform;
  const activeJoinLink = primaryJoinTarget.link;
  const sessionIdValue = streamSessionId || meeting.id;

  return (
    <div className="meeting-detail-v2">
      {/* Compact Header */}
      <header className="meeting-detail-v2__header">
        <div className="meeting-detail-v2__header-left">
          <button
            className="btn btn--ghost btn--icon btn--sm"
            style={{ padding: '6px', width: '32px', height: '32px' }}
            onClick={() => navigate('/app/meetings')}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="meeting-detail-v2__header-info">
            <div className="meeting-detail-v2__header-badges">
                <span className={`badge badge--${(meeting.phase === 'in' || isLiveByTime) ? 'accent' : meeting.phase === 'post' ? 'success' : 'info'}`}>
                  {(meeting.phase === 'in' || isLiveByTime) && <span className="live-dot"></span>}
                {isLiveByTime && meeting.phase === 'pre' ? 'LIVE' : (MEETING_PHASE_LABELS[meeting.phase as keyof typeof MEETING_PHASE_LABELS] || meeting.phase)}
              </span>
              <span className="badge badge--neutral">{MEETING_TYPE_LABELS[meeting.meeting_type as keyof typeof MEETING_TYPE_LABELS] || meeting.meeting_type}</span>
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
          
          <div className="meeting-detail-v2__actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Utility */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn btn--ghost btn--icon btn--sm"
                style={{ padding: '6px', width: '32px', height: '32px' }}
                onClick={fetchMeeting}
                title="Làm mới"
              >
                <RefreshCw size={16} />
              </button>
              {meeting.phase === 'pre' && (
                <button
                  className="btn btn--ghost btn--icon btn--sm"
                  style={{ padding: '6px', width: '32px', height: '32px' }}
                  onClick={handleOpenEdit}
                  title="Chỉnh sửa"
                >
                  <Edit2 size={16} />
                </button>
              )}
              {meeting.phase === 'pre' && (
                <button 
                  className="btn btn--ghost btn--icon btn--sm" 
                  style={{ padding: '6px', width: '32px', height: '32px', color: 'var(--error)' }}
                  onClick={() => setShowDeleteConfirm(true)} 
                  title="Xóa cuộc họp"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Navigation / join */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/app/meetings" className="btn btn--ghost">Thoát</Link>
              <button
                className="btn btn--secondary"
                onClick={() => setShowJoinModal(true)}
                title="Chọn nền tảng và link tham gia"
              >
                <Video size={16} />
                Tham gia
              </button>
              {primaryJoinTarget.link && (
                <button type="button" className="btn btn--ghost" onClick={handleOpenMeetingLink}>
                  <LinkIcon size={16} />
                  Mở liên kết
                </button>
              )}
            </div>

            {/* Primary outcome */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {meeting.phase === 'pre' && isLiveByTime && (
                <button className="btn btn--accent" onClick={handleStartMeeting}>
                  <span className="live-dot" style={{ marginRight: '6px' }}></span>
                  Đang diễn ra - Tham gia
                </button>
              )}
              
              {meeting.phase === 'pre' && !isLiveByTime && !isEnded && (
                <button className="btn btn--primary" onClick={handleStartMeeting}>
                  <Play size={16} />
                  Bắt đầu họp
                </button>
              )}
              
              {meeting.phase === 'in' && (
                <button className="btn btn--primary" onClick={handleEndMeeting}>
                  <CheckSquare size={16} />
                  Kết thúc họp
                </button>
              )}
              
              {meeting.phase === 'post' && (
                <span className="badge badge--success" style={{ padding: '8px 16px' }}>
                  <CheckSquare size={14} style={{ marginRight: '6px' }} />
                  Đã kết thúc
                </span>
              )}
            </div>
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
            joinPlatform={inMeetingPlatform}
            joinLink={activeJoinLink}
            streamSessionId={sessionIdValue}
            initialAudioIngestToken={audioIngestToken || undefined}
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal__header">
              <h2 className="modal__title">
                <Edit2 size={20} />
                Chỉnh sửa cuộc họp
              </h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal__body">
              <div className="form-group">
                <label className="form-label">Tiêu đề cuộc họp</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Nhập tiêu đề..."
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-input"
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Nhập mô tả..."
                  rows={3}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-base)' }}>
                <div className="form-group">
                  <label className="form-label">
                    <Clock size={14} style={{ marginRight: '6px' }} />
                    Thời gian bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={editForm.start_time}
                    onChange={e => setEditForm({ ...editForm, start_time: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <Clock size={14} style={{ marginRight: '6px' }} />
                    Thời gian kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={editForm.end_time}
                    onChange={e => setEditForm({ ...editForm, end_time: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <Video size={14} style={{ marginRight: '6px' }} />
                  Link MS Teams
                </label>
                <input
                  type="url"
                  className="form-input"
                  value={editForm.teams_link}
                  onChange={e => setEditForm({ ...editForm, teams_link: e.target.value })}
                  placeholder="https://teams.microsoft.com/..."
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <MapPin size={14} style={{ marginRight: '6px' }} />
                  Địa điểm
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.location}
                  onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Phòng họp hoặc Online"
                />
              </div>
            </div>
            
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowEditModal(false)}>
                Hủy
              </button>
              <button 
                className="btn btn--primary" 
                onClick={handleSaveEdit}
                disabled={isSaving || !editForm.title}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal__header">
              <h2 className="modal__title" style={{ color: 'var(--error)' }}>
                <Trash2 size={20} />
                Xóa cuộc họp
              </h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowDeleteConfirm(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal__body">
              <p style={{ marginBottom: 'var(--space-base)' }}>
                Bạn có chắc chắn muốn xóa cuộc họp này?
              </p>
              <div className="card" style={{ background: 'var(--bg-elevated)', padding: 'var(--space-base)' }}>
                <strong>{meeting.title}</strong>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {startTime?.toLocaleString('vi-VN')}
                </div>
              </div>
              <p style={{ marginTop: 'var(--space-base)', fontSize: '13px', color: 'var(--text-muted)' }}>
                Hành động này không thể hoàn tác.
              </p>
            </div>
            
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowDeleteConfirm(false)}>
                Hủy
              </button>
              <button 
                className="btn btn--error" 
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ background: 'var(--error)' }}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Xóa cuộc họp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join meeting modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal__header">
              <h2 className="modal__title">
                <Video size={20} />
                Chọn nền tảng & stream ID
              </h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowJoinModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal__body">
              <div className="pill-switch">
                <button
                  className={`pill-switch__item ${joinPlatform === 'gomeet' ? 'pill-switch__item--active' : ''}`}
                  onClick={() => {
                    setJoinPlatform('gomeet');
                    setSessionInitError(null);
                    setGomeetInitError(null);
                  }}
                >
                  GoMeet
                </button>
                <button
                  className={`pill-switch__item ${joinPlatform === 'gmeet' ? 'pill-switch__item--active' : ''}`}
                  onClick={() => {
                    setJoinPlatform('gmeet');
                    setSessionInitError(null);
                    setGomeetInitError(null);
                  }}
                >
                  Google Meet
                </button>
              </div>

              {joinPlatform === 'gomeet' ? (
                <>
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="form-label">GoMeet host (tự tạo phòng)</label>
                    <p className="form-hint">
                      MeetMate sẽ tạo phòng GoMeet, gắn sessionId + ingestToken, sau đó mở link để bạn vào họp.
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Session ID cho realtime transcript</label>
                    <input
                      type="text"
                      className="form-input"
                      value={sessionIdValue}
                      onChange={e => setStreamSessionId(e.target.value)}
                      placeholder="session_id (mặc định là meeting.id)"
                    />
                    <p className="form-hint">Session ID này sẽ được dùng cho WebSocket ingest/frontend.</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Audio ingest token (tuỳ chọn)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={audioIngestToken}
                      onChange={e => setAudioIngestToken(e.target.value)}
                      placeholder="Dán token nếu đã có"
                    />
                    <p className="form-hint">Để trống: hệ thống sẽ tự tạo token trước khi mở GoMeet.</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">meetingSecretKey (tuỳ chọn)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={gomeetMeetingSecretKey}
                      onChange={e => setGomeetMeetingSecretKey(e.target.value)}
                      placeholder="Dành cho phòng GoMeet đã có sẵn"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">accessCode (tuỳ chọn)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={gomeetAccessCode}
                      onChange={e => setGomeetAccessCode(e.target.value)}
                      placeholder="Access code từ GoMeet"
                    />
                    <p className="form-hint">
                      Nếu không nhập, MeetMate sẽ tự tạo phòng mới qua API StartNewMeeting.
                    </p>
                  </div>

                  {(gomeetHostUrl || gomeetFullJoinUrl) && (
                    <div className="card" style={{ background: 'var(--bg-elevated)', padding: 'var(--space-base)' }}>
                      {gomeetHostUrl && (
                        <a href={gomeetHostUrl} target="_blank" rel="noopener noreferrer" className="pill pill--accent">
                          <LinkIcon size={12} style={{ marginRight: 6 }} />
                          Mở link host
                        </a>
                      )}
                      {gomeetFullJoinUrl && (
                        <a
                          href={gomeetFullJoinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pill pill--ghost"
                          style={{ marginLeft: gomeetHostUrl ? 8 : 0 }}
                        >
                          <LinkIcon size={12} style={{ marginRight: 6 }} />
                          Mở link join (đã gắn token)
                        </a>
                      )}
                    </div>
                  )}

                  {gomeetInitError && (
                    <div className="card" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                      {gomeetInitError}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="form-label">Link cuộc họp</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="Dán link Google Meet hoặc VNPT GoMeet"
                      value={gmeetJoinLink}
                      onChange={e => setGmeetJoinLink(e.target.value)}
                    />
                    <p className="form-hint">Link này sẽ dùng để mở tab mới và gắn vào session in-meeting.</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Session ID cho realtime transcript</label>
                    <input
                      type="text"
                      className="form-input"
                      value={sessionIdValue}
                      onChange={e => setStreamSessionId(e.target.value)}
                      placeholder="session_id (mặc định là meeting.id)"
                    />
                    <p className="form-hint">Session ID này sẽ được dùng cho WebSocket ingest/frontend.</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Audio ingest token (tuỳ chọn)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={audioIngestToken}
                      onChange={e => setAudioIngestToken(e.target.value)}
                      placeholder="Dán token nếu đã có"
                    />
                    <p className="form-hint">Để trống: hệ thống sẽ tự tạo token khi bấm Kết nối.</p>
                  </div>

                  {sessionInitError && (
                    <div className="card" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                      {sessionInitError}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowJoinModal(false)}>
                Đóng
              </button>
              {joinPlatform === 'gomeet' ? (
                <button
                  className="btn btn--primary"
                  onClick={handleLaunchGoMeet}
                  disabled={!sessionIdValue}
                >
                  {isGoMeetLoading ? 'Đang mở GoMeet...' : 'Tạo & mở GoMeet'}
                </button>
              ) : (
                <button
                  className="btn btn--primary"
                  onClick={handleInitRealtimeSession}
                  disabled={!sessionIdValue}
                >
                  {isInitSessionLoading ? 'Đang kết nối...' : 'Kết nối'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetail;
