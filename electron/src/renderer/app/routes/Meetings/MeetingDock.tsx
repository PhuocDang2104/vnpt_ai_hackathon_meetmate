import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Mic, MonitorSmartphone, RefreshCw, ScreenShare, Video, X } from 'lucide-react';
import { InMeetTab } from '../../../features/meetings/components/tabs/InMeetTab';
import { meetingsApi } from '../../../lib/api/meetings';
import type { MeetingWithParticipants } from '../../../shared/dto/meeting';
import { MEETING_PHASE_LABELS } from '../../../shared/dto/meeting';
import { useChatContext } from '../../../contexts/ChatContext';

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
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const { setOverride, clearOverride } = useChatContext();

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

  useEffect(() => {
    const videoEl = previewVideoRef.current;
    if (!videoEl) return;
    if (previewStream) {
      videoEl.srcObject = previewStream;
      const playPromise = videoEl.play();
      if (playPromise) {
        playPromise.catch(() => undefined);
      }
    } else {
      videoEl.srcObject = null;
    }
  }, [previewStream]);

  useEffect(() => {
    if (!previewStream) return;
    const track = previewStream.getVideoTracks()[0];
    if (!track) return;
    const handleEnded = () => {
      setPreviewStream(null);
    };
    track.addEventListener('ended', handleEnded);
    return () => {
      track.removeEventListener('ended', handleEnded);
    };
  }, [previewStream]);

  useEffect(() => {
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [previewStream]);

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

  useEffect(() => {
    if (!meeting) return;
    setOverride({
      scope: 'meeting',
      meetingId: meeting.id,
      phase: 'in',
      title: meeting.title,
    });
  }, [meeting?.id, meeting?.title, setOverride]);

  useEffect(() => {
    return () => clearOverride();
  }, [clearOverride]);

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

  const handleStopPreview = useCallback(() => {
    setPreviewStream(prev => {
      if (prev) {
        prev.getTracks().forEach(track => track.stop());
      }
      return null;
    });
  }, []);

  const handleSelectPreview = useCallback(async () => {
    setPreviewError(null);
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setPreviewError('Trình duyệt không hỗ trợ chia sẻ màn hình.');
      return;
    }
    setIsPreviewLoading(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false,
      });
      setPreviewStream(prev => {
        if (prev) {
          prev.getTracks().forEach(track => track.stop());
        }
        return stream;
      });
    } catch (err) {
      if ((err as DOMException)?.name === 'NotAllowedError') {
        setPreviewError('Bạn đã hủy chọn tab.');
      } else {
        setPreviewError('Không thể lấy nội dung tab/màn hình.');
      }
    } finally {
      setIsPreviewLoading(false);
    }
  }, []);

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
    <div className="sidecar-dock">
      <div className="sidecar-preview">
        <div className="sidecar-preview__card">
          <div className="sidecar-preview__header">
            <div className="sidecar-preview__title">
              <ScreenShare size={16} />
              Chọn tab để xem
            </div>
            <div className="sidecar-preview__actions">
              <button className="btn btn--secondary btn--sm" onClick={handleSelectPreview} disabled={isPreviewLoading}>
                {isPreviewLoading ? 'Đang mở...' : 'Chọn tab để xem'}
              </button>
              {previewStream && (
                <button className="btn btn--ghost btn--sm" onClick={handleStopPreview}>
                  <X size={14} />
                  Dừng xem
                </button>
              )}
            </div>
          </div>
          <div className="sidecar-preview__body">
            {previewStream ? (
              <video ref={previewVideoRef} className="sidecar-preview__video" autoPlay muted playsInline />
            ) : (
              <div className="sidecar-preview__placeholder">
                <p>Chưa có tab nào được chọn.</p>
                <span className="sidecar-preview__hint">
                  Bấm “Chọn tab để xem” để mở hộp thoại chọn Tab / Window / Screen.
                </span>
                {previewError && <span className="sidecar-preview__error">{previewError}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

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
            <button className="btn btn--secondary" onClick={handleSelectPreview} disabled={isPreviewLoading}>
              <ScreenShare size={14} />
              {isPreviewLoading ? 'Đang mở...' : previewStream ? 'Đổi tab xem' : 'Chọn tab để xem'}
            </button>
            {previewStream && (
              <button className="btn btn--ghost" onClick={handleStopPreview}>
                <X size={14} />
                Dừng xem
              </button>
            )}
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
    </div>
  );
};

export default MeetingDock;
