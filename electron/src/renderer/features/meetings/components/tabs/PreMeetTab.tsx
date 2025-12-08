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
  UserPlus,
  Search,
  X,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  Bell,
  Mail,
  CheckCircle,
  Circle,
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
  const [activeSection, setActiveSection] = useState<'agenda' | 'documents' | 'participants' | 'reminders' | 'qa'>('agenda');
  
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
          className={`section-btn ${activeSection === 'reminders' ? 'section-btn--active' : ''}`}
          onClick={() => setActiveSection('reminders')}
        >
          <Bell size={16} />
          Ghi nhớ
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
        {activeSection === 'reminders' && <RemindersSection meetingId={meeting.id} />}
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const participants = meeting.participants || [];

  // Fetch users when modal opens
  useEffect(() => {
    if (showAddModal) {
      fetchUsers();
    }
  }, [showAddModal, searchQuery]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { usersApi } = await import('../../../../lib/api/users');
      const response = await usersApi.list({ search: searchQuery || undefined });
      const existingIds = new Set(participants.map((p: any) => p.user_id));
      setAvailableUsers(response.users.filter((u: any) => !existingIds.has(u.id)));
    } catch (err) {
      // Mock data fallback
      setAvailableUsers([
        { id: 'user-1', email: 'nguyenvana@lpbank.vn', display_name: 'Nguyễn Văn A', department_name: 'PMO' },
        { id: 'user-2', email: 'tranthib@lpbank.vn', display_name: 'Trần Thị B', department_name: 'IT' },
        { id: 'user-3', email: 'levanc@lpbank.vn', display_name: 'Lê Văn C', department_name: 'Security' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleAddParticipants = async () => {
    if (selectedUsers.size === 0) return;
    
    setIsLoading(true);
    try {
      const { meetingsApi } = await import('../../../../lib/api/meetings');
      for (const userId of selectedUsers) {
        await meetingsApi.addParticipant(meeting.id, userId, 'attendee');
      }
      setShowAddModal(false);
      setSelectedUsers(new Set());
      onRefresh();
    } catch (err) {
      console.error('Failed to add participants:', err);
      alert('Không thể thêm thành viên. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="participants-section">
      <div className="section-header">
        <h3>Thành viên ({participants.length})</h3>
        <button className="btn btn--primary btn--sm" onClick={() => setShowAddModal(true)}>
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

      {/* Add Participant Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal__header">
              <h2 className="modal__title">
                <UserPlus size={20} />
                Thêm thành viên
              </h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal__body">
              {/* Search */}
              <div className="form-group">
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              {/* User List */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>
                    Không tìm thấy người dùng
                  </div>
                ) : (
                  availableUsers.map(user => (
                    <label
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-md)',
                        padding: 'var(--space-sm) var(--space-md)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        background: selectedUsers.has(user.id) ? 'var(--accent-subtle)' : 'transparent',
                        border: `1px solid ${selectedUsers.has(user.id) ? 'var(--accent)' : 'transparent'}`,
                        marginBottom: 'var(--space-xs)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUser(user.id)}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <div className="participant-item__avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                        {user.display_name?.charAt(0) || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{user.display_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
                      </div>
                      {user.department_name && (
                        <span className="badge badge--neutral" style={{ fontSize: '11px' }}>
                          {user.department_name}
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
            
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowAddModal(false)}>
                Hủy
              </button>
              <button 
                className="btn btn--primary" 
                onClick={handleAddParticipants}
                disabled={selectedUsers.size === 0 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Thêm {selectedUsers.size > 0 ? `(${selectedUsers.size})` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// REMINDERS SECTION - Questions, Risks, Requests
// ============================================
interface ReminderItem {
  id: string;
  type: 'question' | 'risk' | 'request';
  content: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  createdAt: Date;
}

const RemindersSection = ({ meetingId }: { meetingId: string }) => {
  const STORAGE_KEY = `meetmate_reminders_${meetingId}`;
  
  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    type: 'question' as 'question' | 'risk' | 'request',
    content: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
  });
  const [filter, setFilter] = useState<'all' | 'question' | 'risk' | 'request'>('all');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Save to localStorage whenever reminders change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders, STORAGE_KEY]);

  const handleAddReminder = () => {
    if (!newReminder.content.trim()) return;
    
    const reminder: ReminderItem = {
      id: `rem-${Date.now()}`,
      type: newReminder.type,
      content: newReminder.content.trim(),
      priority: newReminder.priority,
      completed: false,
      createdAt: new Date(),
    };
    
    setReminders(prev => [...prev, reminder]);
    setNewReminder({ type: 'question', content: '', priority: 'medium' });
    setShowAddForm(false);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleToggleComplete = (id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const getTypeIcon = (type: 'question' | 'risk' | 'request') => {
    switch (type) {
      case 'question': return <HelpCircle size={16} className="reminder-icon reminder-icon--question" />;
      case 'risk': return <AlertTriangle size={16} className="reminder-icon reminder-icon--risk" />;
      case 'request': return <MessageSquare size={16} className="reminder-icon reminder-icon--request" />;
    }
  };

  const getTypeLabel = (type: 'question' | 'risk' | 'request') => {
    switch (type) {
      case 'question': return 'Câu hỏi';
      case 'risk': return 'Rủi ro';
      case 'request': return 'Yêu cầu';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'var(--danger)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
    }
  };

  const filteredReminders = filter === 'all' 
    ? reminders 
    : reminders.filter(r => r.type === filter);

  const stats = {
    questions: reminders.filter(r => r.type === 'question').length,
    risks: reminders.filter(r => r.type === 'risk').length,
    requests: reminders.filter(r => r.type === 'request').length,
    completed: reminders.filter(r => r.completed).length,
  };

  return (
    <div className="reminders-section">
      <div className="section-header">
        <h3><Bell size={16} /> Ghi nhớ trong họp</h3>
        <div className="section-actions">
          <button 
            className="btn btn--secondary btn--sm"
            onClick={() => setShowEmailModal(true)}
            disabled={reminders.length === 0}
            title="Gửi email chuẩn bị cho thành viên"
          >
            <Mail size={14} />
            Gửi email
          </button>
          <button className="btn btn--primary btn--sm" onClick={() => setShowAddForm(true)}>
            <Plus size={14} />
            Thêm
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="reminders-stats">
        <div className="reminder-stat" onClick={() => setFilter('all')}>
          <span className="reminder-stat__value">{reminders.length}</span>
          <span className="reminder-stat__label">Tổng</span>
        </div>
        <div className="reminder-stat reminder-stat--question" onClick={() => setFilter('question')}>
          <HelpCircle size={14} />
          <span className="reminder-stat__value">{stats.questions}</span>
        </div>
        <div className="reminder-stat reminder-stat--risk" onClick={() => setFilter('risk')}>
          <AlertTriangle size={14} />
          <span className="reminder-stat__value">{stats.risks}</span>
        </div>
        <div className="reminder-stat reminder-stat--request" onClick={() => setFilter('request')}>
          <MessageSquare size={14} />
          <span className="reminder-stat__value">{stats.requests}</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="reminder-filters">
        {(['all', 'question', 'risk', 'request'] as const).map(type => (
          <button 
            key={type}
            className={`filter-btn ${filter === type ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type === 'all' ? 'Tất cả' : getTypeLabel(type)}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="reminder-add-form">
          <div className="form-row">
            <select 
              value={newReminder.type}
              onChange={e => setNewReminder({ ...newReminder, type: e.target.value as any })}
              className="form-select"
            >
              <option value="question">❓ Câu hỏi</option>
              <option value="risk">⚠️ Rủi ro</option>
              <option value="request">💬 Yêu cầu</option>
            </select>
            <select 
              value={newReminder.priority}
              onChange={e => setNewReminder({ ...newReminder, priority: e.target.value as any })}
              className="form-select"
            >
              <option value="high">🔴 Cao</option>
              <option value="medium">🟡 Trung bình</option>
              <option value="low">🟢 Thấp</option>
            </select>
          </div>
          <textarea
            placeholder="Nhập nội dung cần nhớ raise trong cuộc họp..."
            value={newReminder.content}
            onChange={e => setNewReminder({ ...newReminder, content: e.target.value })}
            className="form-textarea"
            rows={3}
            autoFocus
          />
          <div className="form-actions">
            <button className="btn btn--ghost" onClick={() => setShowAddForm(false)}>
              Hủy
            </button>
            <button 
              className="btn btn--primary" 
              onClick={handleAddReminder}
              disabled={!newReminder.content.trim()}
            >
              <Plus size={14} />
              Thêm
            </button>
          </div>
        </div>
      )}

      {/* Reminders List */}
      <div className="reminders-list">
        {filteredReminders.length > 0 ? (
          filteredReminders.map(reminder => (
            <div 
              key={reminder.id} 
              className={`reminder-item ${reminder.completed ? 'reminder-item--completed' : ''}`}
            >
              <button 
                className="reminder-item__check"
                onClick={() => handleToggleComplete(reminder.id)}
              >
                {reminder.completed ? (
                  <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                ) : (
                  <Circle size={18} />
                )}
              </button>
              <div className="reminder-item__content">
                <div className="reminder-item__header">
                  {getTypeIcon(reminder.type)}
                  <span 
                    className="reminder-item__priority"
                    style={{ background: getPriorityColor(reminder.priority) }}
                  />
                  <span className="reminder-item__type">{getTypeLabel(reminder.type)}</span>
                </div>
                <p className="reminder-item__text">{reminder.content}</p>
              </div>
              <button 
                className="btn btn--ghost btn--icon btn--sm"
                onClick={() => handleDeleteReminder(reminder.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state-mini">
            <Bell size={24} />
            <p>Chưa có ghi nhớ nào</p>
            <span>Thêm câu hỏi, rủi ro, hoặc yêu cầu để AI nhắc trong họp</span>
          </div>
        )}
      </div>

      {/* AI Suggestion */}
      {reminders.length > 0 && (
        <div className="ai-suggestion">
          <Sparkles size={14} />
          <span>
            AI sẽ nhắc bạn {stats.questions > 0 && `${stats.questions} câu hỏi`}
            {stats.risks > 0 && `${stats.questions > 0 ? ', ' : ''}${stats.risks} rủi ro`}
            {stats.requests > 0 && `${(stats.questions > 0 || stats.risks > 0) ? ', ' : ''}${stats.requests} yêu cầu`}
            {' '}trong cuộc họp
          </span>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <SendPreparationEmailModal 
          meetingId={meetingId}
          reminders={reminders}
          onClose={() => setShowEmailModal(false)}
          isSending={isSendingEmail}
          setIsSending={setIsSendingEmail}
        />
      )}
    </div>
  );
};

// ============================================
// SEND PREPARATION EMAIL MODAL
// ============================================
interface SendPreparationEmailModalProps {
  meetingId: string;
  reminders: ReminderItem[];
  onClose: () => void;
  isSending: boolean;
  setIsSending: (val: boolean) => void;
}

const SendPreparationEmailModal = ({ 
  meetingId, 
  reminders, 
  onClose, 
  isSending, 
  setIsSending 
}: SendPreparationEmailModalProps) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const [includeAgenda, setIncludeAgenda] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [includeReminders, setIncludeReminders] = useState(true);
  const [personalizeByRole, setPersonalizeByRole] = useState(true);

  useEffect(() => {
    fetchParticipants();
  }, [meetingId]);

  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const { meetingsApi } = await import('../../../../lib/api/meetings');
      const meeting = await meetingsApi.getById(meetingId);
      const participantsList = meeting.participants || [];
      setParticipants(participantsList);
      // Select all by default
      setSelectedParticipants(new Set(participantsList.map((p: any) => p.user_id || p.id)));
    } catch (err) {
      console.error('Failed to fetch participants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleParticipant = (id: string) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedParticipants(newSelected);
  };

  const handleSendEmails = async () => {
    if (selectedParticipants.size === 0) return;
    
    setIsSending(true);
    try {
      const { minutesApi } = await import('../../../../lib/api/minutes');
      
      // For each selected participant, send personalized email
      for (const participantId of selectedParticipants) {
        const participant = participants.find(p => (p.user_id || p.id) === participantId);
        if (!participant?.email) continue;

        // Build personalized content based on role
        let emailContent = `Kính gửi ${participant.display_name || 'Quý thành viên'},\n\n`;
        emailContent += `Bạn được mời tham gia cuộc họp sắp tới. Dưới đây là thông tin chuẩn bị:\n\n`;

        if (personalizeByRole && participant.role === 'organizer') {
          emailContent += `🎯 Với vai trò Chủ trì, vui lòng:\n`;
          emailContent += `- Kiểm tra và duyệt agenda\n`;
          emailContent += `- Chuẩn bị điều phối các phần thảo luận\n\n`;
        } else if (personalizeByRole && participant.role === 'chair') {
          emailContent += `👔 Với vai trò Chủ tọa, vui lòng:\n`;
          emailContent += `- Xem xét các điểm chính cần quyết định\n`;
          emailContent += `- Chuẩn bị ý kiến chỉ đạo\n\n`;
        }

        if (includeReminders && reminders.length > 0) {
          const relevantReminders = reminders.filter(r => 
            !personalizeByRole || 
            (participant.role === 'organizer' || participant.role === 'chair') ||
            r.priority === 'high'
          );
          
          if (relevantReminders.length > 0) {
            emailContent += `📋 Các điểm cần lưu ý:\n`;
            relevantReminders.forEach(r => {
              const icon = r.type === 'question' ? '❓' : r.type === 'risk' ? '⚠️' : '💬';
              emailContent += `${icon} ${r.content}\n`;
            });
            emailContent += '\n';
          }
        }

        emailContent += `Trân trọng,\nMeetMate AI`;

        // Send via API
        await minutesApi.distribute(meetingId, {
          channel: 'email',
          recipients: [participant.email],
          content: emailContent,
        });
      }

      setEmailSent(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to send emails:', err);
      alert('Không thể gửi email. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'organizer': return 'Chủ trì';
      case 'chair': return 'Chủ tọa';
      case 'presenter': return 'Trình bày';
      default: return 'Thành viên';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal email-prepare-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal__header">
          <h2 className="modal__title">
            <Mail size={20} />
            Gửi email chuẩn bị cuộc họp
          </h2>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal__body">
          {emailSent ? (
            <div className="email-sent-success">
              <CheckCircle size={48} style={{ color: 'var(--success)' }} />
              <h3>Đã gửi email thành công!</h3>
              <p>Đã gửi {selectedParticipants.size} email cá nhân hóa đến các thành viên.</p>
            </div>
          ) : (
            <>
              {/* Options */}
              <div className="email-options">
                <h4>Nội dung email</h4>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={includeAgenda} 
                    onChange={e => setIncludeAgenda(e.target.checked)} 
                  />
                  <Calendar size={14} />
                  Bao gồm Agenda
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={includeDocuments} 
                    onChange={e => setIncludeDocuments(e.target.checked)} 
                  />
                  <FileText size={14} />
                  Bao gồm Tài liệu
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={includeReminders} 
                    onChange={e => setIncludeReminders(e.target.checked)} 
                  />
                  <Bell size={14} />
                  Bao gồm Ghi nhớ ({reminders.length})
                </label>
                <label className="checkbox-label checkbox-label--highlight">
                  <input 
                    type="checkbox" 
                    checked={personalizeByRole} 
                    onChange={e => setPersonalizeByRole(e.target.checked)} 
                  />
                  <Sparkles size={14} />
                  Cá nhân hóa theo vai trò (AI)
                </label>
              </div>

              {/* Participants */}
              <div className="email-participants">
                <h4>Chọn người nhận ({selectedParticipants.size}/{participants.length})</h4>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                ) : (
                  <div className="participant-select-list">
                    {participants.map((p: any) => (
                      <label 
                        key={p.user_id || p.id} 
                        className={`participant-select-item ${selectedParticipants.has(p.user_id || p.id) ? 'selected' : ''}`}
                      >
                        <input 
                          type="checkbox"
                          checked={selectedParticipants.has(p.user_id || p.id)}
                          onChange={() => toggleParticipant(p.user_id || p.id)}
                        />
                        <div className="participant-item__avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                          {(p.display_name || p.email || '?').charAt(0)}
                        </div>
                        <div className="participant-info">
                          <span className="participant-name">{p.display_name || p.email}</span>
                          <span className="participant-email">{p.email}</span>
                        </div>
                        <span className={`badge badge--${p.role === 'organizer' ? 'accent' : 'neutral'}`} style={{ fontSize: '10px' }}>
                          {getRoleLabel(p.role)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview */}
              {personalizeByRole && (
                <div className="email-preview-note">
                  <Sparkles size={14} />
                  <span>
                    Email sẽ được cá nhân hóa: <strong>Chủ trì</strong> nhận hướng dẫn điều phối, 
                    <strong> Chủ tọa</strong> nhận điểm cần quyết định, 
                    <strong> Thành viên</strong> nhận thông tin chuẩn bị chung.
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {!emailSent && (
          <div className="modal__footer">
            <button className="btn btn--secondary" onClick={onClose}>
              Hủy
            </button>
            <button 
              className="btn btn--primary" 
              onClick={handleSendEmails}
              disabled={selectedParticipants.size === 0 || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Gửi {selectedParticipants.size} email
                </>
              )}
            </button>
          </div>
        )}
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
            <p>Tôi có thể giúp bạn tìm hiểu về policy, tài liệu, hoặc context cuộc họp.</p>
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

