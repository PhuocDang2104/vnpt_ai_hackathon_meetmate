import { useState } from 'react';
import {
  FileText,
  Users,
  Calendar,
  Sparkles,
  Plus,
  Check,
  Clock,
  User,
  ExternalLink,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Send,
  Bot,
} from 'lucide-react';
import type { MeetingWithParticipants } from '../../../../shared/dto/meeting';
import { aiApi } from '../../../../lib/api/ai';

interface PreMeetTabProps {
  meeting: MeetingWithParticipants;
  onRefresh: () => void;
}

export const PreMeetTab = ({ meeting, onRefresh }: PreMeetTabProps) => {
  const [activeSection, setActiveSection] = useState<'agenda' | 'documents' | 'participants' | 'qa'>('agenda');
  
  return (
    <div className="premeet-tab">
      {/* Section Switcher */}
      <div className="section-switcher">
        <button 
          className={`section-btn ${activeSection === 'agenda' ? 'section-btn--active' : ''}`}
          onClick={() => setActiveSection('agenda')}
        >
          <Calendar size={16} />
          Chương trình
        </button>
        <button 
          className={`section-btn ${activeSection === 'documents' ? 'section-btn--active' : ''}`}
          onClick={() => setActiveSection('documents')}
        >
          <FileText size={16} />
          Tài liệu
        </button>
        <button 
          className={`section-btn ${activeSection === 'participants' ? 'section-btn--active' : ''}`}
          onClick={() => setActiveSection('participants')}
        >
          <Users size={16} />
          Thành viên
        </button>
        <button 
          className={`section-btn ${activeSection === 'qa' ? 'section-btn--active' : ''}`}
          onClick={() => setActiveSection('qa')}
        >
          <Sparkles size={16} />
          AI Q&A
        </button>
      </div>

      {/* Content */}
      <div className="premeet-content">
        {activeSection === 'agenda' && <AgendaSection meeting={meeting} />}
        {activeSection === 'documents' && <DocumentsSection meetingId={meeting.id} />}
        {activeSection === 'participants' && <ParticipantsSection meeting={meeting} onRefresh={onRefresh} />}
        {activeSection === 'qa' && <AIQASection meetingId={meeting.id} />}
      </div>
    </div>
  );
};

// Agenda Section
const AgendaSection = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [agenda, setAgenda] = useState<Array<{ title: string; duration: number; presenter: string }>>([
    { title: 'Khai mạc & Điểm danh', duration: 5, presenter: 'Chủ tọa' },
    { title: 'Báo cáo tiến độ dự án', duration: 15, presenter: 'PM' },
    { title: 'Thảo luận vấn đề & Blockers', duration: 20, presenter: 'Tất cả' },
    { title: 'Quyết định & Action Items', duration: 15, presenter: 'Chủ tọa' },
    { title: 'Kết luận', duration: 5, presenter: 'Chủ tọa' },
  ]);

  const handleGenerateAgenda = async () => {
    setIsGenerating(true);
    try {
      const result = await aiApi.generateAgenda(meeting.id, meeting.meeting_type);
      // Parse result and set agenda
      console.log('Generated agenda:', result);
    } catch (err) {
      console.error('Failed to generate agenda:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalDuration = agenda.reduce((sum, item) => sum + item.duration, 0);

  return (
    <div className="agenda-section">
      <div className="section-header">
        <h3>Chương trình cuộc họp</h3>
        <button className="btn btn--secondary btn--sm" onClick={handleGenerateAgenda} disabled={isGenerating}>
          {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          AI Tạo agenda
        </button>
      </div>

      <div className="agenda-list">
        {agenda.map((item, index) => (
          <div key={index} className="agenda-item">
            <div className="agenda-item__number">{index + 1}</div>
            <div className="agenda-item__content">
              <div className="agenda-item__title">{item.title}</div>
              <div className="agenda-item__presenter">
                <User size={12} />
                {item.presenter}
              </div>
            </div>
            <div className="agenda-item__duration">
              <Clock size={12} />
              {item.duration} phút
            </div>
          </div>
        ))}
      </div>

      <div className="agenda-summary">
        <Clock size={16} />
        <span>Tổng thời gian: <strong>{totalDuration} phút</strong></span>
      </div>
    </div>
  );
};

// Documents Section
const DocumentsSection = ({ meetingId }: { meetingId: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const documents = [
    { id: '1', title: 'Báo cáo tiến độ Q4', source: 'SharePoint', relevance: 0.95, status: 'accepted' },
    { id: '2', title: 'Risk Assessment Template', source: 'LOffice', relevance: 0.88, status: 'suggested' },
    { id: '3', title: 'Thông tư 09/2020 NHNN', source: 'Wiki', relevance: 0.82, status: 'suggested' },
  ];

  return (
    <div className="documents-section">
      <div className="section-header">
        <h3>Tài liệu cần đọc trước</h3>
        <button className="btn btn--secondary btn--sm" onClick={() => setIsLoading(true)}>
          <Sparkles size={14} />
          AI Gợi ý
        </button>
      </div>

      <div className="document-list">
        {documents.map(doc => (
          <div key={doc.id} className={`document-card ${doc.status === 'accepted' ? 'document-card--accepted' : ''}`}>
            <div className="document-card__header">
              <FileText size={16} />
              <span className="document-card__title">{doc.title}</span>
              {doc.status === 'accepted' ? (
                <span className="badge badge--success"><Check size={10} /> Đã chọn</span>
              ) : (
                <button className="btn btn--ghost btn--sm"><Plus size={14} /></button>
              )}
            </div>
            <div className="document-card__meta">
              <span className="badge badge--neutral">{doc.source}</span>
              <span>Độ liên quan: {Math.round(doc.relevance * 100)}%</span>
              <ExternalLink size={12} className="text-accent" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Participants Section
const ParticipantsSection = ({ meeting, onRefresh }: { meeting: MeetingWithParticipants; onRefresh: () => void }) => {
  const participants = meeting.participants || [];

  return (
    <div className="participants-section">
      <div className="section-header">
        <h3>Thành viên ({participants.length})</h3>
        <button className="btn btn--primary btn--sm">
          <Plus size={14} />
          Mời thêm
        </button>
      </div>

      <div className="participant-list">
        {participants.length > 0 ? participants.map((p: any) => (
          <div key={p.id} className="participant-item">
            <div className="participant-item__avatar">
              {p.display_name?.charAt(0) || p.email?.charAt(0) || '?'}
            </div>
            <div className="participant-item__info">
              <div className="participant-item__name">{p.display_name || p.email}</div>
              <div className="participant-item__role">{p.role || 'Thành viên'}</div>
            </div>
            <span className={`badge badge--${p.role === 'organizer' ? 'accent' : 'neutral'}`}>
              {p.role === 'organizer' ? 'Chủ trì' : 'Thành viên'}
            </span>
          </div>
        )) : (
          <div className="empty-state-mini">
            <Users size={24} />
            <p>Chưa có thành viên nào</p>
          </div>
        )}
      </div>

      <div className="ai-suggestion">
        <Sparkles size={14} />
        <span>AI gợi ý: Nên mời thêm <strong>Security Architect</strong> cho cuộc họp này</span>
      </div>
    </div>
  );
};

// AI Q&A Section
const AIQASection = ({ meetingId }: { meetingId: string }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;
    
    const userQuery = query.trim();
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await aiApi.sendMessage(userQuery, meetingId);
      setMessages(prev => [...prev, { role: 'ai', content: response.message }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'Thời gian lưu trữ dữ liệu theo NHNN?',
    'Security requirements cho Core Banking?',
    'Những risks chính của dự án là gì?',
  ];

  return (
    <div className="ai-qa-section">
      <div className="section-header">
        <h3><Sparkles size={16} /> MeetMate AI</h3>
      </div>

      <div className="ai-messages">
        {messages.length === 0 ? (
          <div className="ai-welcome">
            <Bot size={32} />
            <p>Xin chào! Tôi có thể giúp bạn tìm hiểu về policy, tài liệu, hoặc context cuộc họp.</p>
            <div className="suggested-questions">
              {suggestedQuestions.map((q, i) => (
                <button key={i} className="suggested-btn" onClick={() => setQuery(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`ai-message ai-message--${msg.role}`}>
              {msg.role === 'ai' && <Bot size={16} />}
              <div className="ai-message__content">{msg.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="ai-message ai-message--ai ai-message--loading">
            <Loader2 size={16} className="animate-spin" />
            <span>Đang suy nghĩ...</span>
          </div>
        )}
      </div>

      <div className="ai-input">
        <input
          type="text"
          placeholder="Hỏi về policy, tài liệu, dự án..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <button className="btn btn--primary btn--icon" onClick={handleSend} disabled={!query.trim() || isLoading}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default PreMeetTab;

