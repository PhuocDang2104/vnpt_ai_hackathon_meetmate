import { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  CheckSquare,
  FileText,
  AlertTriangle,
  Sparkles,
  Check,
  X,
  Edit3,
  User,
  Clock,
  Send,
  Bot,
  Loader2,
  Play,
  Pause,
} from 'lucide-react';
import type { MeetingWithParticipants } from '../../../../shared/dto/meeting';
import { aiApi } from '../../../../lib/api/ai';

interface InMeetTabProps {
  meeting: MeetingWithParticipants;
  onRefresh: () => void;
  onEndMeeting: () => void;
}

export const InMeetTab = ({ meeting, onRefresh, onEndMeeting }: InMeetTabProps) => {
  const [isRecording, setIsRecording] = useState(meeting.phase === 'in');

  return (
    <div className="inmeet-tab">
      {/* Recording Status Bar */}
      <div className={`recording-bar ${isRecording ? 'recording-bar--active' : ''}`}>
        <div className="recording-bar__status">
          {isRecording ? (
            <>
              <span className="live-dot"></span>
              <Mic size={16} />
              <span>Đang ghi chép</span>
            </>
          ) : (
            <>
              <MicOff size={16} />
              <span>Tạm dừng</span>
            </>
          )}
        </div>
        <div className="recording-bar__actions">
          <button 
            className="btn btn--ghost btn--sm"
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? <Pause size={14} /> : <Play size={14} />}
            {isRecording ? 'Tạm dừng' : 'Tiếp tục'}
          </button>
          <button className="btn btn--accent btn--sm" onClick={onEndMeeting}>
            <CheckSquare size={14} />
            Kết thúc họp
          </button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="inmeet-split">
        {/* Left: Transcript */}
        <div className="inmeet-transcript">
          <TranscriptPanel meetingId={meeting.id} isRecording={isRecording} />
        </div>

        {/* Right: Detected Items + AI */}
        <div className="inmeet-sidebar">
          <DetectedItemsPanel meetingId={meeting.id} />
          <AIAssistantMini meetingId={meeting.id} />
        </div>
      </div>
    </div>
  );
};

// Transcript Panel
const TranscriptPanel = ({ meetingId, isRecording }: { meetingId: string; isRecording: boolean }) => {
  const [transcript, setTranscript] = useState([
    { id: '1', speaker: 'Nguyễn Văn A', time: '00:00', text: 'Xin chào mọi người, chúng ta bắt đầu cuộc họp hôm nay.' },
    { id: '2', speaker: 'Trần Thị B', time: '00:15', text: 'Dạ vâng, em xin báo cáo tiến độ dự án Core Banking.' },
    { id: '3', speaker: 'Trần Thị B', time: '00:30', text: 'Hiện tại chúng ta đang ở milestone 3, tiến độ overall là 68%.' },
    { id: '4', speaker: 'Phạm Văn C', time: '01:00', text: 'Có một vấn đề về performance của batch processing cần thảo luận.' },
  ]);

  return (
    <div className="transcript-panel">
      <div className="transcript-header">
        <h3><Mic size={16} /> Live Transcript</h3>
        {isRecording && (
          <span className="badge badge--accent">
            <span className="live-dot"></span>
            Recording
          </span>
        )}
      </div>

      <div className="transcript-content">
        {transcript.map(chunk => (
          <div key={chunk.id} className="transcript-chunk">
            <div className="transcript-chunk__avatar">
              {chunk.speaker.split(' ').slice(-1)[0][0]}
            </div>
            <div className="transcript-chunk__body">
              <div className="transcript-chunk__header">
                <span className="transcript-chunk__speaker">{chunk.speaker}</span>
                <span className="transcript-chunk__time">{chunk.time}</span>
              </div>
              <div className="transcript-chunk__text">{chunk.text}</div>
            </div>
          </div>
        ))}

        {isRecording && (
          <div className="transcript-chunk transcript-chunk--typing">
            <div className="transcript-chunk__avatar">?</div>
            <div className="transcript-chunk__body">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Detected Items Panel
const DetectedItemsPanel = ({ meetingId }: { meetingId: string }) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'decisions' | 'risks'>('actions');
  
  const items = {
    actions: [
      { id: '1', text: 'Gửi báo cáo Penetration Test cho team Risk', owner: 'Hoàng Thị E', status: 'proposed' },
      { id: '2', text: 'Update Risk Register với timeline mới', owner: 'Lê Văn C', status: 'confirmed' },
    ],
    decisions: [
      { id: '1', text: 'Approve điều chuyển 2 senior developers từ Mobile team', confirmedBy: 'Vũ Văn G' },
    ],
    risks: [
      { id: '1', text: 'Go-live có thể delay nếu không đủ resources', severity: 'high' },
    ],
  };

  return (
    <div className="detected-panel">
      <div className="detected-tabs">
        <button 
          className={`detected-tab ${activeTab === 'actions' ? 'detected-tab--active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          <CheckSquare size={14} />
          Actions ({items.actions.length})
        </button>
        <button 
          className={`detected-tab ${activeTab === 'decisions' ? 'detected-tab--active' : ''}`}
          onClick={() => setActiveTab('decisions')}
        >
          <FileText size={14} />
          Decisions ({items.decisions.length})
        </button>
        <button 
          className={`detected-tab ${activeTab === 'risks' ? 'detected-tab--active' : ''}`}
          onClick={() => setActiveTab('risks')}
        >
          <AlertTriangle size={14} />
          Risks ({items.risks.length})
        </button>
      </div>

      <div className="detected-content">
        {activeTab === 'actions' && items.actions.map(item => (
          <div key={item.id} className="detected-item detected-item--action">
            <div className="detected-item__content">
              <div className="detected-item__text">{item.text}</div>
              <div className="detected-item__meta">
                <User size={12} />
                {item.owner}
              </div>
            </div>
            <div className="detected-item__actions">
              <button className="btn btn--success btn--icon btn--sm"><Check size={14} /></button>
              <button className="btn btn--ghost btn--icon btn--sm"><Edit3 size={14} /></button>
              <button className="btn btn--ghost btn--icon btn--sm"><X size={14} /></button>
            </div>
          </div>
        ))}

        {activeTab === 'decisions' && items.decisions.map(item => (
          <div key={item.id} className="detected-item detected-item--decision">
            <div className="detected-item__content">
              <div className="detected-item__text">{item.text}</div>
              <div className="detected-item__meta">
                <Check size={12} />
                Xác nhận bởi {item.confirmedBy}
              </div>
            </div>
          </div>
        ))}

        {activeTab === 'risks' && items.risks.map(item => (
          <div key={item.id} className={`detected-item detected-item--risk detected-item--${item.severity}`}>
            <div className="detected-item__content">
              <div className="detected-item__text">{item.text}</div>
              <span className={`badge badge--${item.severity === 'high' ? 'error' : 'warning'}`}>
                {item.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mini AI Assistant
const AIAssistantMini = ({ meetingId }: { meetingId: string }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await aiApi.sendMessage(query, meetingId);
      setResponse(result.message);
    } catch {
      setResponse('Không thể trả lời lúc này.');
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  return (
    <div className="ai-mini">
      <div className="ai-mini__header">
        <Sparkles size={14} />
        <span>Hỏi nhanh AI</span>
      </div>
      
      {response && (
        <div className="ai-mini__response">
          <Bot size={14} />
          <p>{response}</p>
          <button className="btn btn--ghost btn--sm" onClick={() => setResponse(null)}>
            <X size={12} />
          </button>
        </div>
      )}

      <div className="ai-mini__input">
        <input
          type="text"
          placeholder="VD: Data retention policy là gì?"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
        />
        <button className="btn btn--primary btn--icon btn--sm" onClick={handleAsk} disabled={isLoading}>
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
};

export default InMeetTab;

