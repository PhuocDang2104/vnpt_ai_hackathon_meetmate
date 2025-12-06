import { useState, useEffect } from 'react';
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
  Loader2,
  Send,
  Bot,
  Save,
  Edit2,
  Trash2,
  GripVertical,
  Upload,
} from 'lucide-react';
import type { MeetingWithParticipants } from '../../../../shared/dto/meeting';
import { aiApi } from '../../../../lib/api/ai';
import { agendaApi, type AgendaItem, type AgendaItemCreate } from '../../../../lib/api/agenda';
import { documentsApi, type Document } from '../../../../lib/api/documents';

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

// ============================================
// AGENDA SECTION - with AI generation and editing
// ============================================
const AgendaSection = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editedItems, setEditedItems] = useState<AgendaItemCreate[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [aiNotes, setAiNotes] = useState<string | null>(null);

  // Load agenda on mount
  useEffect(() => {
    loadAgenda();
  }, [meeting.id]);

  const loadAgenda = async () => {
    setIsLoading(true);
    try {
      const result = await agendaApi.listByMeeting(meeting.id);
      setAgendaItems(result.items);
      setEditedItems(result.items.map(item => ({
        order_index: item.order_index,
        title: item.title,
        duration_minutes: item.duration_minutes,
        presenter_name: item.presenter_name,
        description: item.description,
      })));
    } catch (err) {
      console.error('Failed to load agenda:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAgenda = async () => {
    setIsGenerating(true);
    try {
      const result = await agendaApi.generate({
        meeting_id: meeting.id,
        meeting_title: meeting.title,
        meeting_type: meeting.meeting_type,
        meeting_description: meeting.description || undefined,
        duration_minutes: getDurationMinutes(),
        participants: meeting.participants?.map(p => p.display_name || p.email) || [],
      });
      
      setEditedItems(result.items);
      setAiNotes(result.ai_notes || null);
      setHasChanges(true);
    } catch (err) {
      console.error('Failed to generate agenda:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDurationMinutes = (): number => {
    if (meeting.start_time && meeting.end_time) {
      const start = new Date(meeting.start_time).getTime();
      const end = new Date(meeting.end_time).getTime();
      return Math.round((end - start) / 60000);
    }
    return 60;
  };

  const handleSaveAgenda = async () => {
    setIsSaving(true);
    try {
      const result = await agendaApi.save({
        meeting_id: meeting.id,
        items: editedItems,
      });
      setAgendaItems(result.items);
      setHasChanges(false);
      setAiNotes(null);
    } catch (err) {
      console.error('Failed to save agenda:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItem = (index: number, field: keyof AgendaItemCreate, value: string | number) => {
    const updated = [...editedItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditedItems(updated);
    setHasChanges(true);
  };

  const handleDeleteItem = (index: number) => {
    const updated = editedItems.filter((_, i) => i !== index);
    // Reindex
    updated.forEach((item, i) => item.order_index = i);
    setEditedItems(updated);
    setHasChanges(true);
  };

  const handleAddItem = () => {
    setEditedItems([...editedItems, {
      order_index: editedItems.length,
      title: 'Mục mới',
      duration_minutes: 10,
      presenter_name: '',
    }]);
    setHasChanges(true);
  };

  const totalDuration = editedItems.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
  const displayItems = hasChanges ? editedItems : agendaItems;

  if (isLoading) {
    return (
      <div className="agenda-section">
        <div className="section-loading">
          <Loader2 size={24} className="animate-spin" />
          <span>Đang tải agenda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="agenda-section">
      <div className="section-header">
        <h3>Chương trình cuộc họp</h3>
        <div className="section-actions">
          <button 
            className="btn btn--secondary btn--sm" 
            onClick={handleGenerateAgenda} 
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI Tạo agenda
          </button>
          {hasChanges && (
            <button 
              className="btn btn--primary btn--sm" 
              onClick={handleSaveAgenda}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Lưu
            </button>
          )}
        </div>
      </div>

      {aiNotes && (
        <div className="ai-notes">
          <Sparkles size={14} />
          <span>{aiNotes}</span>
        </div>
      )}

      <div className="agenda-list">
        {displayItems.map((item, index) => (
          <div key={item.id || index} className="agenda-item agenda-item--editable">
            <div className="agenda-item__drag">
              <GripVertical size={16} />
            </div>
            <div className="agenda-item__number">{index + 1}</div>
            <div className="agenda-item__content">
              {editingItem === (item.id || String(index)) ? (
                <input
                  type="text"
                  className="agenda-item__input"
                  value={hasChanges ? editedItems[index]?.title : (item as AgendaItem).title}
                  onChange={e => handleUpdateItem(index, 'title', e.target.value)}
                  onBlur={() => setEditingItem(null)}
                  autoFocus
                />
              ) : (
                <div 
                  className="agenda-item__title" 
                  onClick={() => {
                    setEditingItem(item.id || String(index));
                    if (!hasChanges) {
                      setEditedItems(agendaItems.map(a => ({
                        order_index: a.order_index,
                        title: a.title,
                        duration_minutes: a.duration_minutes,
                        presenter_name: a.presenter_name,
                        description: a.description,
                      })));
                      setHasChanges(true);
                    }
                  }}
                >
                  {hasChanges ? editedItems[index]?.title : (item as AgendaItem).title}
                  <Edit2 size={12} className="edit-icon" />
                </div>
              )}
              <div className="agenda-item__presenter">
                <User size={12} />
                <input
                  type="text"
                  className="agenda-item__input agenda-item__input--small"
                  placeholder="Người trình bày"
                  value={hasChanges ? editedItems[index]?.presenter_name || '' : (item as AgendaItem).presenter_name || ''}
                  onChange={e => {
                    if (!hasChanges) {
                      setEditedItems(agendaItems.map(a => ({
                        order_index: a.order_index,
                        title: a.title,
                        duration_minutes: a.duration_minutes,
                        presenter_name: a.presenter_name,
                        description: a.description,
                      })));
                      setHasChanges(true);
                    }
                    handleUpdateItem(index, 'presenter_name', e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="agenda-item__duration">
              <Clock size={12} />
              <input
                type="number"
                className="agenda-item__input agenda-item__input--number"
                value={hasChanges ? editedItems[index]?.duration_minutes : (item as AgendaItem).duration_minutes}
                onChange={e => {
                  if (!hasChanges) {
                    setEditedItems(agendaItems.map(a => ({
                      order_index: a.order_index,
                      title: a.title,
                      duration_minutes: a.duration_minutes,
                      presenter_name: a.presenter_name,
                      description: a.description,
                    })));
                    setHasChanges(true);
                  }
                  handleUpdateItem(index, 'duration_minutes', parseInt(e.target.value) || 0);
                }}
                min={1}
              />
              <span>phút</span>
            </div>
            <button 
              className="btn btn--ghost btn--icon btn--sm"
              onClick={() => handleDeleteItem(index)}
              title="Xóa"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn--ghost btn--sm add-item-btn" onClick={handleAddItem}>
        <Plus size={14} />
        Thêm mục
      </button>

      <div className="agenda-summary">
        <Clock size={16} />
        <span>Tổng thời gian: <strong>{totalDuration} phút</strong></span>
        {meeting.start_time && meeting.end_time && (
          <span className="agenda-summary__target">
            (Mục tiêu: {getDurationMinutes()} phút)
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// DOCUMENTS SECTION - with upload and listing
// ============================================
const DocumentsSection = ({ meetingId }: { meetingId: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', file_type: 'pdf', description: '' });

  useEffect(() => {
    loadDocuments();
  }, [meetingId]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const result = await documentsApi.listByMeeting(meetingId);
      setDocuments(result.documents);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!newDoc.title.trim()) return;
    
    setIsUploading(true);
    try {
      await documentsApi.upload({
        meeting_id: meetingId,
        title: newDoc.title,
        file_type: newDoc.file_type,
        description: newDoc.description || undefined,
      });
      setNewDoc({ title: '', file_type: 'pdf', description: '' });
      setShowUploadForm(false);
      loadDocuments();
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await documentsApi.delete(docId);
      loadDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const getFileIcon = (fileType: string) => {
    return <FileText size={16} />;
  };

  if (isLoading) {
    return (
      <div className="documents-section">
        <div className="section-loading">
          <Loader2 size={24} className="animate-spin" />
          <span>Đang tải tài liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="documents-section">
      <div className="section-header">
        <h3>Tài liệu cần đọc trước</h3>
        <button 
          className="btn btn--primary btn--sm" 
          onClick={() => setShowUploadForm(true)}
        >
          <Upload size={14} />
          Thêm tài liệu
        </button>
      </div>

      {showUploadForm && (
        <div className="upload-form">
          <h4>Thêm tài liệu mới</h4>
          <div className="form-group">
            <label>Tiêu đề</label>
            <input
              type="text"
              placeholder="Tên tài liệu..."
              value={newDoc.title}
              onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Loại file</label>
            <select 
              value={newDoc.file_type}
              onChange={e => setNewDoc({ ...newDoc, file_type: e.target.value })}
            >
              <option value="pdf">PDF</option>
              <option value="docx">Word (DOCX)</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="pptx">PowerPoint (PPTX)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mô tả (tùy chọn)</label>
            <input
              type="text"
              placeholder="Mô tả ngắn..."
              value={newDoc.description}
              onChange={e => setNewDoc({ ...newDoc, description: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button 
              className="btn btn--ghost" 
              onClick={() => setShowUploadForm(false)}
            >
              Hủy
            </button>
            <button 
              className="btn btn--primary" 
              onClick={handleUpload}
              disabled={!newDoc.title.trim() || isUploading}
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Thêm
            </button>
          </div>
        </div>
      )}

      <div className="document-list">
        {documents.length > 0 ? documents.map(doc => (
          <div key={doc.id} className="document-card">
            <div className="document-card__header">
              {getFileIcon(doc.file_type)}
              <span className="document-card__title">{doc.title}</span>
              <div className="document-card__actions">
                <a href={doc.file_url || '#'} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                </a>
                <button 
                  className="btn btn--ghost btn--icon btn--sm"
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="document-card__meta">
              <span className="badge badge--neutral">{doc.file_type.toUpperCase()}</span>
              {doc.description && <span>{doc.description}</span>}
            </div>
          </div>
        )) : (
          <div className="empty-state-mini">
            <FileText size={24} />
            <p>Chưa có tài liệu nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// PARTICIPANTS SECTION
// ============================================
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
          <div key={p.user_id || p.id} className="participant-item">
            <div className="participant-item__avatar">
              {p.display_name?.charAt(0) || p.email?.charAt(0) || '?'}
            </div>
            <div className="participant-item__info">
              <div className="participant-item__name">{p.display_name || p.email}</div>
              <div className="participant-item__role">{p.role || 'Thành viên'}</div>
            </div>
            <span className={`badge badge--${p.role === 'organizer' ? 'accent' : 'neutral'}`}>
              {p.role === 'organizer' ? 'Chủ trì' : p.role === 'chair' ? 'Chủ tọa' : 'Thành viên'}
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

// ============================================
// AI Q&A SECTION
// ============================================
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

