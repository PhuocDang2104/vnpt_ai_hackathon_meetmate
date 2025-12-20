import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Mic, MonitorSmartphone, RefreshCw, Video } from 'lucide-react';
import { InMeetTab } from '../../../features/meetings/components/tabs/InMeetTab';
import { meetingsApi } from '../../../lib/api/meetings';
import type { MeetingWithParticipants } from '../../../shared/dto/meeting';
import { MEETING_PHASE_LABELS } from '../../../shared/dto/meeting';

const MeetingDock = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<MeetingWithParticipants | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinLink, setJoinLink] = useState('');
  const [joinPlatform, setJoinPlatform] = useState<'gomeet' | 'gmeet'>('gomeet');
  const [streamSessionId, setStreamSessionId] = useState<string>('');

  const sessionFromQuery = searchParams.get('session');
  const linkFromQuery = searchParams.get('link');
  const platformFromQuery = searchParams.get('platform');
  const tokenFromQuery = searchParams.get('token') || '';

  useEffect(() => {
    if (platformFromQuery === 'gmeet') {
      setJoinPlatform('gmeet');
    }
  }, [platformFromQuery]);

  useEffect(() => {
    document.body.classList.add('sidecar-mode');
    return () => document.body.classList.remove('sidecar-mode');
  }, []);

  const fetchMeeting = useCallback(async () => {
    if (!meetingId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await meetingsApi.get(meetingId);
      setMeeting(data);
      setJoinLink(linkFromQuery || data.teams_link || '');
      setStreamSessionId(sessionFromQuery || data.id);
    } catch (err) {
      console.error('Failed to fetch meeting for dock view:', err);
      setError('Không thể tải cuộc họp (dock view).');
    } finally {
      setIsLoading(false);
    }
  }, [linkFromQuery, meetingId, sessionFromQuery]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  const handleEndMeeting = async () => {
    if (!meetingId) return;
    try {
      await meetingsApi.updatePhase(meetingId, 'post');
      fetchMeeting();
    } catch (err) {
      console.error('Failed to end meeting:', err);
      setError('Không kết thúc được cuộc họp.');
    }
  };

  const handleOpenJoinLink = () => {
    if (!joinLink) return;
    window.open(joinLink, '_blank', 'noopener,noreferrer');
  };

  const handleOpenCapturePage = () => {
    if (!meeting) return;
    const params = new URLSearchParams();
    if (streamSessionId) params.set('session', streamSessionId);
    if (joinLink) params.set('link', joinLink);
    if (tokenFromQuery) params.set('token', tokenFromQuery);
    const qs = params.toString();
    window.open(`#/app/meetings/${meeting.id}/capture${qs ? `?${qs}` : ''}`, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="meeting-detail-loading">
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
        <p>Đang mở Dock in-meeting...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="empty-state">
        <AlertCircle className="empty-state__icon" />
        <h3 className="empty-state__title">{error || 'Không tìm thấy cuộc họp'}</h3>
        <button className="btn btn--secondary" onClick={() => navigate('/app/meetings')}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="sidecar-page">
      <div className="sidecar-header">
        <div className="sidecar-header__left">
          <button className="btn btn--ghost btn--icon" onClick={() => navigate(`/app/meetings/${meeting.id}/detail`)}>
            <ArrowLeft size={18} />
          </button>
          <div className="sidecar-header__info">
            <div className="sidecar-header__eyebrow">Dock in-meeting</div>
            <h2 className="sidecar-header__title">{meeting.title}</h2>
            <div className="sidecar-header__meta">
              <span className="pill pill--ghost">
                {MEETING_PHASE_LABELS[meeting.phase as keyof typeof MEETING_PHASE_LABELS] || meeting.phase}
              </span>
            </div>
          </div>
        </div>
        <div className="sidecar-header__actions">
          <button className="btn btn--secondary" onClick={fetchMeeting}>
            <RefreshCw size={14} />
            Làm mới
          </button>
          <button className="btn btn--secondary" onClick={() => navigate(`/app/meetings/${meeting.id}/detail`)}>
            <MonitorSmartphone size={14} />
            Mở chế độ đầy đủ
          </button>
          {joinPlatform === 'gmeet' && (
            <button className="btn btn--secondary" onClick={handleOpenCapturePage}>
              <Mic size={14} />
              Capture tab audio
            </button>
          )}
          {joinLink && (
            <button className="btn btn--primary" onClick={handleOpenJoinLink}>
              <Video size={14} />
              Mở link họp
            </button>
          )}
        </div>
      </div>

      <div className="sidecar-body">
        <InMeetTab
          meeting={meeting}
          joinPlatform={joinPlatform}
          joinLink={joinLink}
          streamSessionId={streamSessionId || meeting.id}
          initialAudioIngestToken={tokenFromQuery || undefined}
          onRefresh={fetchMeeting}
          onEndMeeting={handleEndMeeting}
        />
      </div>
    </div>
  );
};

export default MeetingDock;
