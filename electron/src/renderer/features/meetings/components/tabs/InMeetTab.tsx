import { useMemo, useState } from 'react';
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
  getInitials,
  risks,
  transcriptChunks,
} from '../../../../store/mockData';
import { AIAssistantChat } from '../AIAssistantChat';

interface InMeetTabProps {
  meeting: MeetingWithParticipants;
  onRefresh: () => void;
  onEndMeeting: () => void;
}

export const InMeetTab = ({ meeting, onRefresh, onEndMeeting }: InMeetTabProps) => {
  const [isRecording, setIsRecording] = useState(meeting.phase === 'in');

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

  return (
    <div className="inmeet-tab">
      <div className="inmeet-grid">
        <div className="inmeet-column inmeet-column--main">
          <LiveTranscriptPanel transcript={transcript} isRecording={isRecording} />
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

const LiveTranscriptPanel = ({
  transcript,
  isRecording,
}: {
  transcript: typeof transcriptChunks;
  isRecording: boolean;
}) => (
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
          <div className="transcript-header__right">
            {isRecording ? (
              <span className="pill pill--live pill--solid">
                <span className="live-dot"></span>
                Recording
              </span>
            ) : (
              <span className="pill pill--muted">Paused</span>
            )}
          </div>
        </div>

        <div className="transcript-content transcript-content--padded">
          {transcript.map(chunk => (
            <div key={chunk.id} className="transcript-card">
              <div className="transcript-card__avatar">{getInitials(chunk.speaker.displayName)}</div>
              <div className="transcript-card__body">
                <div className="transcript-card__row">
                  <span className="transcript-card__speaker">{chunk.speaker.displayName}</span>
                  <span className="transcript-card__time">{formatDuration(chunk.startTime)}</span>
                </div>
                <p className="transcript-card__text">{chunk.text}</p>
              </div>
            </div>
          ))}
          {isRecording && (
            <div className="transcript-card transcript-card--typing">
              <div className="transcript-card__avatar">?</div>
              <div className="transcript-card__body">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p className="transcript-card__hint">Đang nhận partial từ SmartVoice...</p>
              </div>
            </div>
          )}
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
  decisions,
  risks,
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
          Decisions ({decisions.length})
        </button>
        <button
          className={`detected-tab ${activeTab === 'risks' ? 'detected-tab--active' : ''}`}
          onClick={() => setActiveTab('risks')}
        >
          <AlertTriangle size={14} />
          Risks ({risks.length})
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
          decisions.length > 0 ? (
            decisions.map(item => (
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
          risks.length > 0 ? (
            risks.map(item => (
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

