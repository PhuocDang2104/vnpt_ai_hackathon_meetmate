import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckSquare,
  Clock,
  Edit3,
  FileText,
  Link as LinkIcon,
  Mic,
  Sparkles,
  User,
  Wand2,
  X,
} from 'lucide-react';
import type { MeetingWithParticipants } from '../../../../shared/dto/meeting';
import {
  actionItems,
  decisions,
  formatDuration,
  risks,
  transcriptChunks,
} from '../../../../store/mockData';
import { AIAssistantChat } from '../AIAssistantChat';
import { API_URL, USE_API } from '../../../../config/env';

type WsStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disabled';
interface InMeetTabProps {
  meeting: MeetingWithParticipants;
  joinPlatform: 'gomeet' | 'gmeet';
  joinLink: string;
  streamSessionId: string;
  onRefresh: () => void;
  onEndMeeting: () => void;
}

export const InMeetTab = ({
  meeting,
  joinPlatform,
  joinLink,
  streamSessionId,
  onRefresh,
  onEndMeeting,
}: InMeetTabProps) => {
  const [feedStatus, setFeedStatus] = useState<WsStatus>(USE_API ? 'idle' : 'disabled');
  const [wsNonce, setWsNonce] = useState(0);
  const [lastTranscriptAt, setLastTranscriptAt] = useState<number | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<
    { id: string; speaker: string; text: string; time: number; isFinal: boolean }[]
  >([]);

  const feedRef = useRef<WebSocket | null>(null);
  const wsBase = useMemo(() => {
    if (API_URL.startsWith('https://')) return API_URL.replace(/^https:/i, 'wss:').replace(/\/$/, '');
    if (API_URL.startsWith('http://')) return API_URL.replace(/^http:/i, 'ws:').replace(/\/$/, '');
    return API_URL.replace(/\/$/, '');
  }, []);
  const feedEndpoint = useMemo(() => `${wsBase}/api/v1/ws/frontend/${streamSessionId}`, [wsBase, streamSessionId]);

  const transcript = useMemo(
    () => transcriptChunks.filter(chunk => chunk.meetingId === meeting.id).slice(0, 8),
    [meeting.id],
  );

  const actions = useMemo(() => {
    const scoped = actionItems.filter(a => a.meetingId === meeting.id).slice(0, 4);
    return scoped.length > 0 ? scoped : actionItems.slice(0, 3);
  }, [meeting.id]);

  const meetingDecisions = useMemo(() => {
    const scoped = decisions.filter(d => d.meetingId === meeting.id).slice(0, 3);
    return scoped.length > 0 ? scoped : decisions.slice(0, 2);
  }, [meeting.id]);

  const meetingRisks = useMemo(() => {
    const scoped = risks.filter(r => r.meetingId === meeting.id).slice(0, 3);
    return scoped.length > 0 ? scoped : risks.slice(0, 2);
  }, [meeting.id]);

  useEffect(() => {
    if (!USE_API) {
      setFeedStatus('disabled');
      return;
    }
    setFeedStatus('connecting');
    const socket = new WebSocket(feedEndpoint);
    feedRef.current = socket;

    socket.onopen = () => {
      setFeedStatus('connected');
    };
    socket.onclose = () => {
      setFeedStatus(USE_API ? 'idle' : 'disabled');
    };
    socket.onerror = evt => {
      console.error('Frontend WS error', evt);
      setFeedStatus('error');
    };
    socket.onmessage = event => {
      const raw = typeof event.data === 'string' ? event.data : '';
      try {
        const data = JSON.parse(raw);
        if (data?.event === 'transcript_event') {
          const p = data.payload || {};
          setLastTranscriptAt(Date.now());
          setLiveTranscript(prev => {
            const next = [
              ...prev,
              {
                id: String(data.seq || Date.now()),
                speaker: p.speaker || 'SPEAKER_01',
                text: p.chunk || '',
                time: p.time_start || 0,
                isFinal: p.is_final !== false,
              },
            ].slice(-40);
            return next;
          });
        }
      } catch (_e) {
        /* ignore */
      }
    };

    return () => {
      socket.close();
      feedRef.current = null;
    };
  }, [feedEndpoint, wsNonce]);

  const handleReconnect = () => {
    feedRef.current?.close();
    setFeedStatus(USE_API ? 'connecting' : 'disabled');
    setLastTranscriptAt(null);
    setWsNonce(prev => prev + 1);
  };

  return (
    <div className="inmeet-tab">
      <div className="inmeet-grid">
        <div className="inmeet-column inmeet-column--main">
          <LiveTranscriptPanel
            transcript={transcript}
            liveTranscript={liveTranscript}
            joinPlatform={joinPlatform}
            joinLink={joinLink}
            feedStatus={feedStatus}
            lastTranscriptAt={lastTranscriptAt}
            onReconnect={handleReconnect}
          />
          <LiveRecapPanel />
        </div>

        <div className="inmeet-column inmeet-column--side">
          <AdrPanel
            actions={actions}
            decisions={meetingDecisions}
            risks={meetingRisks}
          />
          <ToolSuggestionsPanel />
          <AIAssistantChat meetingId={meeting.id} meetingTitle={meeting.title} />
        </div>
      </div>
    </div>
  );
};

interface TranscriptPanelProps {
  transcript: typeof transcriptChunks;
  liveTranscript: { id: string; speaker: string; text: string; time: number; isFinal: boolean }[];
  joinPlatform: 'gomeet' | 'gmeet';
  joinLink: string;
  feedStatus: WsStatus;
  lastTranscriptAt: number | null;
  onReconnect: () => void;
}

const AudioStreamIndicator = ({
  feedStatus,
  lastTranscriptAt,
}: {
  feedStatus: WsStatus;
  lastTranscriptAt: number | null;
}) => {
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1500);
    return () => window.clearInterval(id);
  }, []);

  const status = useMemo(() => {
    if (feedStatus === 'error') {
      return { tone: 'error', label: 'WS lỗi', hint: 'Frontend channel không phản hồi' };
    }
    if (feedStatus === 'connecting' || feedStatus === 'idle') {
      return { tone: 'idle', label: 'Đang kết nối...', hint: 'Đợi bắt tay WebSocket' };
    }
    if (feedStatus === 'disabled') {
      return { tone: 'idle', label: 'API tắt', hint: 'USE_API=false' };
    }
    if (!lastTranscriptAt) {
      return { tone: 'idle', label: 'Chưa nhận audio', hint: 'Chờ frame đầu tiên' };
    }
    const delta = tick - lastTranscriptAt;
    if (delta < 6000) {
      return { tone: 'live', label: 'Đang nhận audio', hint: 'Frame realtime từ WS' };
    }
    if (delta < 15000) {
      return { tone: 'warn', label: 'Tạm ngưng luồng', hint: 'Chưa thấy frame mới' };
    }
    return { tone: 'idle', label: 'Không có audio', hint: 'Kiểm tra GoMeet/Meet' };
  }, [feedStatus, lastTranscriptAt, tick]);

  return (
    <div className={`audio-indicator audio-indicator--${status.tone}`} title={status.hint}>
      <div className="audio-indicator__pulse">
        <span className="audio-indicator__wave"></span>
        <span className="audio-indicator__wave audio-indicator__wave--delay"></span>
        <span className="audio-indicator__core"></span>
      </div>
      <div className="audio-indicator__labels">
        <div className="audio-indicator__title">Audio stream</div>
        <div className="audio-indicator__status">{status.label}</div>
      </div>
    </div>
  );
};

const LiveTranscriptPanel = ({
  transcript,
  liveTranscript,
  joinPlatform,
  joinLink,
  feedStatus,
  lastTranscriptAt,
  onReconnect,
}: TranscriptPanelProps) => {
  const displayItems = useMemo(() => {
    const maxItems = 50;
    if (liveTranscript?.length) {
      return liveTranscript.slice(-maxItems).map(t => ({
        id: t.id,
        speakerName: t.speaker,
        time: t.time,
        text: t.text,
      }));
    }
    return transcript.slice(-maxItems).map(chunk => ({
      id: chunk.id,
      speakerName: chunk.speaker.displayName,
      time: chunk.startTime,
      text: chunk.text,
    }));
  }, [liveTranscript, transcript]);
  const lastFrameLabel = useMemo(() => {
    if (feedStatus === 'error') return 'Frontend WS lỗi - thử kết nối lại';
    if (feedStatus === 'connecting' || feedStatus === 'idle') return 'Đang chờ bắt tay WebSocket';
    if (feedStatus === 'disabled') return 'Realtime WS đang tắt (USE_API=false)';
    if (!lastTranscriptAt) return 'Chưa nhận frame audio nào';
    return `Frame cuối: ${new Date(lastTranscriptAt).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  }, [feedStatus, lastTranscriptAt]);

  return (
    <div className="transcript-panel transcript-panel--glass">
      <div className="transcript-grid transcript-grid--equal">
        <div className="transcript-col transcript-col--main">
          <div className="transcript-header">
            <div className="transcript-title">
              <div className="transcript-title__icon">
                <Mic size={16} />
              </div>
              <div className="transcript-title__text">
                <div className="transcript-title__label">Live Transcript</div>
                <div className="transcript-title__sub">
                  <Clock size={12} />
                  Context cửa sổ 30s
                </div>
              </div>
            </div>
            <div
              className="transcript-header__right"
              style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}
            >
              <AudioStreamIndicator feedStatus={feedStatus} lastTranscriptAt={lastTranscriptAt} />
              <button
                className="btn btn--ghost btn--sm"
                onClick={onReconnect}
                disabled={feedStatus === 'disabled'}
                style={{ minWidth: 120 }}
              >
                {feedStatus === 'connected' ? 'Làm mới WS' : 'Kết nối WS'}
              </button>
            </div>
          </div>

          <div className="transcript-connection">
            <span className="pill pill--ghost">
              Nền tảng: {joinPlatform === 'gomeet' ? 'VNPT GoMeet' : 'Google Meet'}
            </span>
            {joinLink && (
              <a href={joinLink} target="_blank" rel="noopener noreferrer" className="pill pill--accent">
                <LinkIcon size={12} style={{ marginRight: 6 }} />
                Mở link cuộc họp
              </a>
            )}
          </div>

          <div className="transcript-content transcript-content--padded">
            <div
              className="transcript-card transcript-card--live"
              style={{ minHeight: 220, maxHeight: 360, display: 'flex', flexDirection: 'column' }}
            >
              <div className="transcript-card__body">
                <div className="transcript-card__row" style={{ alignItems: 'center', gap: 8 }}>
                  <div className="pill pill--live pill--solid">
                    <span className="live-dot"></span>
                    SmartVoice API ...
                  </div>
                  <span className="pill pill--ghost">Realtime transcript</span>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    overflowY: 'auto',
                    paddingRight: 4,
                    maxHeight: 260,
                  }}
                >
                  {displayItems.length === 0 && (
                    <div className="transcript-card__hint">Chưa có đoạn thoại nào.</div>
                  )}
                  {displayItems.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 4,
                          color: 'var(--text-muted)',
                          fontSize: 12,
                        }}
                      >
                        <span>{item.speakerName}</span>
                        <span>{formatDuration(item.time || 0)}</span>
                      </div>
                      <div style={{ fontSize: 16, lineHeight: 1.4 }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="transcript-mini-status">
              <span className={`pill ws-chip ws-chip--${feedStatus}`}>
                Frontend WS · {feedStatus}
              </span>
              <span className="transcript-mini-status__meta">{lastFrameLabel}</span>
            </div>
          </div>
        </div>

        <div className="transcript-col transcript-col--main">
          <div className="live-signal-card live-signal-card--stack">
            <div className="live-signal-card__header">
              <div className="badge badge--ghost badge--pill">
                <Sparkles size={14} />
                Live recap | Semantic Router
              </div>
              <span className="meta-chip">SmartBot VNPT</span>
            </div>

            <div className="live-signal-card__section live-signal-card__chat">
              <div className="live-signal-label">Recap</div>
              <div className="live-signal-bubble">
                <div className="live-signal-bubble__content">
                  <p>
                    Core Banking tiến độ 68%. Batch processing đang tối ưu, cần 2 senior dev để giữ timeline 01/01.
                    Security: còn 3 medium issues, đang fix trước go-live.
                  </p>
                </div>
              </div>
            </div>

            <div className="live-signal-card__section live-signal-card__inline">
              <div>
                <div className="live-signal-label">Intent</div>
                <div className="pill pill--live">NO_INTENT</div>
              </div>
              <div>
                <div className="live-signal-label">Topic</div>
                <div className="pill">Core Banking Performance</div>
              </div>
            </div>

            <div className="live-signal-card__section">
              <div className="live-signal-label">Topic log (3-5 phút)</div>
              <div className="topic-log">
                <div className="topic-log__item">
                  <span className="topic-log__time">00:45</span>
                  <span className="topic-log__text">Status update</span>
                </div>
                <div className="topic-log__item">
                  <span className="topic-log__time">01:10</span>
                  <span className="topic-log__text">Performance & risk</span>
                </div>
                <div className="topic-log__item">
                  <span className="topic-log__time">01:40</span>
                  <span className="topic-log__text">Resource decision</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LiveRecapPanel = () => {
  const recap = [
    { id: 'rc1', t: '00:45', text: 'Tiến độ Core Banking đạt 68%, milestone 3 đang SIT.', topic: 'Status' },
    { id: 'rc2', t: '01:10', text: 'Nguy cơ delay 2 tuần nếu không thêm 2 senior dev.', topic: 'Risk' },
    { id: 'rc3', t: '01:40', text: 'Đề xuất điều chuyển resources từ Mobile team trong 4 tuần.', topic: 'Decision' },
  ];

  return (
    <div className="recap-panel">
      <div className="recap-panel__header">
        <div className="badge badge--ghost badge--pill">
          <Sparkles size={14} />
          Current Recap
        </div>
        <span className="meta-chip">
          <Calendar size={12} />
          Topic: Core Banking Performance
        </span>
      </div>
      <div className="recap-list">
        {recap.map(item => (
          <div key={item.id} className="recap-item">
            <div className="recap-item__time">{item.t}</div>
            <div className="recap-item__body">
              <div className="recap-item__topic">{item.topic}</div>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdrPanel = ({
  actions,
  decisions: decisionItems,
  risks: riskItems,
}: {
  actions: typeof actionItems;
  decisions: typeof decisions;
  risks: typeof risks;
}) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'decisions' | 'risks'>('actions');

  return (
    <div className="detected-panel detected-panel--elevated">
      <div className="detected-tabs detected-tabs--solid">
        <button
          className={`detected-tab ${activeTab === 'actions' ? 'detected-tab--active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          <CheckSquare size={14} />
          Actions ({actions.length})
        </button>
        <button
          className={`detected-tab ${activeTab === 'decisions' ? 'detected-tab--active' : ''}`}
          onClick={() => setActiveTab('decisions')}
        >
          <FileText size={14} />
          Decisions ({decisionItems.length})
        </button>
        <button
          className={`detected-tab ${activeTab === 'risks' ? 'detected-tab--active' : ''}`}
          onClick={() => setActiveTab('risks')}
        >
          <AlertTriangle size={14} />
          Risks ({riskItems.length})
        </button>
      </div>

      <div className="detected-content detected-content--dense">
        {activeTab === 'actions' && (
          actions.length > 0 ? (
            actions.map(item => (
              <div key={item.id} className="detected-item detected-item--action">
                <div className="detected-item__content">
                  <div className="detected-item__text">{item.description}</div>
                  <div className="detected-item__meta">
                    <User size={12} />
                    {item.owner.displayName}
                    <span className="dot"></span>
                    <Clock size={12} />
                    {item.deadline.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
                <div className="detected-item__actions">
                  <button className="btn btn--success btn--icon btn--sm">
                    <Check size={14} />
                  </button>
                  <button className="btn btn--ghost btn--icon btn--sm">
                    <Edit3 size={14} />
                  </button>
                  <button className="btn btn--ghost btn--icon btn--sm">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state empty-state--inline">Chưa có action nào.</div>
          )
        )}

        {activeTab === 'decisions' && (
          decisionItems.length > 0 ? (
            decisionItems.map(item => (
              <div key={item.id} className="detected-item detected-item--decision">
                <div className="detected-item__content">
                  <div className="detected-item__text">{item.description}</div>
                  <div className="detected-item__meta">
                    <Check size={12} />
                    Xác nhận bởi {item.confirmedBy.displayName}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state empty-state--inline">Chưa có quyết định.</div>
          )
        )}

        {activeTab === 'risks' && (
          riskItems.length > 0 ? (
            riskItems.map(item => (
              <div
                key={item.id}
                className={`detected-item detected-item--risk detected-item--${item.severity}`}
              >
                <div className="detected-item__content">
                  <div className="detected-item__text">{item.description}</div>
                  <span className={`badge badge--${item.severity === 'high' ? 'error' : 'warning'}`}>
                    {item.severity}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state empty-state--inline">Chưa có rủi ro.</div>
          )
        )}
      </div>
    </div>
  );
};

const ToolSuggestionsPanel = () => {
  const suggestions = [
    {
      id: 'ts1',
      type: 'task',
      title: 'Tạo task Jira: Penetration Test follow-up',
      detail: 'Owner: Hoàng Thị E · Due: 12/12 · Priority: High',
      actionLabel: 'Tạo task',
    },
    {
      id: 'ts2',
      type: 'schedule',
      title: 'Đặt lịch follow-up performance review',
      detail: '30 phút, tuần này, mời PMO + Core Banking',
      actionLabel: 'Đặt lịch',
    },
    {
      id: 'ts3',
      type: 'doc',
      title: 'Mở tài liệu: NHNN Circular 09/2020',
      detail: 'Trang 12: Data retention policy',
      actionLabel: 'Mở tài liệu',
    },
  ];

  return (
    <div className="tool-panel">
      <div className="tool-panel__header">
        <div className="badge badge--ghost badge--pill">
          <Wand2 size={14} />
          Tool suggestions
        </div>
        <span className="meta-chip">
          <LinkIcon size={12} />
          Planner / Calendar / Docs
        </span>
      </div>
      <div className="tool-panel__list">
        {suggestions.map(s => (
          <div key={s.id} className="tool-card">
            <div className="tool-card__icon">
              {s.type === 'task' && <CheckSquare size={14} />}
              {s.type === 'schedule' && <Calendar size={14} />}
              {s.type === 'doc' && <FileText size={14} />}
            </div>
            <div className="tool-card__body">
              <div className="tool-card__title">{s.title}</div>
              <div className="tool-card__detail">{s.detail}</div>
            </div>
            <div className="tool-card__actions">
              <button className="btn btn--primary btn--sm">{s.actionLabel}</button>
              <button className="btn btn--ghost btn--icon btn--sm">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InMeetTab;
