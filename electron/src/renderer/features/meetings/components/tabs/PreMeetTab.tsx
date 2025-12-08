import { useState, useEffect, useMemo } from 'react';
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
  CheckSquare,
  Link as LinkIcon,
  Wand2,
} from 'lucide-react';
import type { MeetingWithParticipants } from '../../../../shared/dto/meeting';
import { aiApi } from '../../../../lib/api/ai';
import { agendaApi, type AgendaItem, type AgendaItemCreate } from '../../../../lib/api/agenda';
import { documentsApi, type Document } from '../../../../lib/api/documents';

interface PreMeetTabProps {
  meeting: MeetingWithParticipants;
  onRefresh: () => void;
}

// ============================================
// MAIN COMPONENT - Grid Layout like InMeet
// ============================================
export const PreMeetTab = ({ meeting, onRefresh }: PreMeetTabProps) => {
  return (
    <div className="inmeet-tab"> {/* Reuse inmeet-tab styles for consistency */}
      <div className="inmeet-grid">
        {/* Main Column - Agenda & Preparation */}
        <div className="inmeet-column inmeet-column--main">
          <AgendaPanel meeting={meeting} />
          <RemindersPanel meetingId={meeting.id} />
        </div>

        {/* Side Column - Participants, Documents, AI */}
        <div className="inmeet-column inmeet-column--side">
          <PrepStatusPanel meeting={meeting} />
          <ParticipantsPanel meeting={meeting} onRefresh={onRefresh} />
          <DocumentsPanel meetingId={meeting.id} />
          <AIAssistantPanel meetingId={meeting.id} />
        </div>
      </div>
    </div>
  );
};

// ============================================
// AGENDA PANEL - Glass style like InMeet
// ============================================
const AgendaPanel = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [editedItems, setEditedItems] = useState<AgendaItemCreate[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

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

  const getDurationMinutes = (): number => {
    if (meeting.start_time && meeting.end_time) {
      const start = new Date(meeting.start_time).getTime();
      const end = new Date(meeting.end_time).getTime();
      return Math.round((end - start) / 60000);
    }
    return 60;
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
      setHasChanges(true);
    } catch (err) {
      console.error('Failed to generate agenda:', err);
    } finally {
      setIsGenerating(false);
    }
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

  return (
    <div className="transcript-panel transcript-panel--glass">
      <div className="transcript-header">
        <div className="transcript-title">
          <div className="transcript-title__icon">
            <Calendar size={16} />
          </div>
          <div className="transcript-title__text">
            <div className="transcript-title__label">Chương trình họp</div>
            <div className="transcript-title__sub">
              <Clock size={12} />
              {totalDuration}/{getDurationMinutes()} phút
            </div>
          </div>
        </div>
        <div className="transcript-header__right" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button 
            className="btn btn--ghost btn--sm" 
            onClick={handleGenerateAgenda} 
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI Tạo
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

      <div className="transcript-content transcript-content--padded">
        {isLoading ? (
          <div className="empty-state empty-state--inline">
            <Loader2 size={20} className="animate-spin" />
            Đang tải...
          </div>
        ) : displayItems.length > 0 ? (
          <>
            {displayItems.map((item, index) => (
              <div key={item.id || index} className="detected-item detected-item--action">
                <div className="detected-item__number">{index + 1}</div>
                <div className="detected-item__content" style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="detected-item__input"
                    value={hasChanges ? editedItems[index]?.title : (item as AgendaItem).title}
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
                      handleUpdateItem(index, 'title', e.target.value);
                    }}
                  />
                  <div className="detected-item__meta">
                    <User size={12} />
                    <input
                      type="text"
                      className="detected-item__input detected-item__input--small"
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
                    <span className="dot"></span>
                    <Clock size={12} />
                    <input
                      type="number"
                      className="detected-item__input detected-item__input--number"
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
                      style={{ width: '50px' }}
                    />
                    <span>phút</span>
                  </div>
                </div>
                <button 
                  className="btn btn--ghost btn--icon btn--sm"
                  onClick={() => handleDeleteItem(index)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button className="btn btn--ghost btn--sm" onClick={handleAddItem} style={{ marginTop: 'var(--space-sm)' }}>
              <Plus size={14} />
              Thêm mục
            </button>
          </>
        ) : (
          <div className="empty-state empty-state--inline">
            <Calendar size={20} />
            <span>Chưa có agenda. Nhấn "AI Tạo" để tự động tạo.</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// REMINDERS PANEL - Similar to AdrPanel
// ============================================
interface ReminderItem {
  id: string;
  type: 'question' | 'risk' | 'request';
  content: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

const RemindersPanel = ({ meetingId }: { meetingId: string }) => {
  const STORAGE_KEY = `meetmate_reminders_${meetingId}`;
  const [activeTab, setActiveTab] = useState<'question' | 'risk' | 'request'>('question');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders, STORAGE_KEY]);

  const questions = reminders.filter(r => r.type === 'question');
  const risks = reminders.filter(r => r.type === 'risk');
  const requests = reminders.filter(r => r.type === 'request');

  const handleAdd = () => {
    if (!newContent.trim()) return;
    setReminders([...reminders, {
      id: `rem-${Date.now()}`,
      type: activeTab,
      content: newContent.trim(),
      priority: newPriority,
      completed: false,
    }]);
    setNewContent('');
    setShowAddForm(false);
  };

  const handleToggle = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const handleDelete = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'badge--error';
      case 'medium': return 'badge--warning';
      default: return 'badge--success';
    }
  };

  const currentItems = activeTab === 'question' ? questions : activeTab === 'risk' ? risks : requests;

  return (
    <div className="detected-panel detected-panel--elevated">
      <div className="detected-tabs detected-tabs--solid">
        <button
          className={`detected-tab ${activeTab === 'question' ? 'detected-tab--active' : ''}`}
          onClick={() => setActiveTab('question')}
        >
          <HelpCircle size={14} />
          Câu hỏi ({questions.length})
        </button>
        <button
          className={`detected-tab ${activeTab === 'risk' ? 'detected-tab--active' : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          <AlertTriangle size={14} />
          Rủi ro ({risks.length})
        </button>
        <button
          className={`detected-tab ${activeTab === 'request' ? 'detected-tab--active' : ''}`}
          onClick={() => setActiveTab('request')}
        >
          <MessageSquare size={14} />
          Yêu cầu ({requests.length})
        </button>
      </div>

      <div className="detected-content detected-content--dense">
        {showAddForm ? (
          <div className="reminder-add-inline">
            <div className="reminder-add-inline__row">
              <select 
                value={newPriority} 
                onChange={e => setNewPriority(e.target.value as any)}
                className="reminder-add-inline__select"
              >
                <option value="high">🔴 Cao</option>
                <option value="medium">🟡 TB</option>
                <option value="low">🟢 Thấp</option>
              </select>
              <input
                type="text"
                className="reminder-add-inline__input"
                placeholder={`Thêm ${activeTab === 'question' ? 'câu hỏi' : activeTab === 'risk' ? 'rủi ro' : 'yêu cầu'}...`}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
            </div>
            <div className="reminder-add-inline__actions">
              <button className="btn btn--ghost btn--sm" onClick={() => setShowAddForm(false)}>
                Hủy
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleAdd} disabled={!newContent.trim()}>
                <Plus size={14} />
                Thêm
              </button>
            </div>
          </div>
        ) : (
          <button 
            className="btn btn--ghost btn--sm" 
            onClick={() => setShowAddForm(true)}
            style={{ width: '100%', justifyContent: 'center', marginBottom: 'var(--space-sm)' }}
          >
            <Plus size={14} />
            Thêm {activeTab === 'question' ? 'câu hỏi' : activeTab === 'risk' ? 'rủi ro' : 'yêu cầu'}
          </button>
        )}

        {currentItems.length > 0 ? (
          currentItems.map(item => (
            <div 
              key={item.id} 
              className={`detected-item detected-item--${activeTab} ${item.completed ? 'detected-item--completed' : ''}`}
            >
              <button className="detected-item__check" onClick={() => handleToggle(item.id)}>
                {item.completed ? <CheckCircle size={16} /> : <Circle size={16} />}
              </button>
              <div className="detected-item__content">
                <div className="detected-item__text">{item.content}</div>
              </div>
              <span className={`badge ${getPriorityBadge(item.priority)}`} style={{ fontSize: '10px' }}>
                {item.priority === 'high' ? 'Cao' : item.priority === 'medium' ? 'TB' : 'Thấp'}
              </span>
              <button className="btn btn--ghost btn--icon btn--sm" onClick={() => handleDelete(item.id)}>
                <X size={14} />
              </button>
            </div>
          ))
        ) : !showAddForm && (
          <div className="empty-state empty-state--inline">
            {activeTab === 'question' && 'Thêm câu hỏi cần hỏi trong họp'}
            {activeTab === 'risk' && 'Thêm rủi ro cần raise trong họp'}
            {activeTab === 'request' && 'Thêm yêu cầu cần đề xuất trong họp'}
          </div>
        )}

        {reminders.length > 0 && (
          <div className="reminder-hint">
            <Sparkles size={12} />
            AI sẽ nhắc bạn {reminders.filter(r => !r.completed).length} điểm trong cuộc họp
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// PREP STATUS PANEL - Quick overview
// ============================================
const PrepStatusPanel = ({ meeting }: { meeting: MeetingWithParticipants }) => {
  const participants = meeting.participants || [];
  const [agendaCount, setAgendaCount] = useState(0);
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const agenda = await agendaApi.listByMeeting(meeting.id);
        setAgendaCount(agenda.items.length);
      } catch { setAgendaCount(0); }
      try {
        const docs = await documentsApi.listByMeeting(meeting.id);
        setDocCount(docs.documents.length);
      } catch { setDocCount(0); }
    };
    loadCounts();
  }, [meeting.id]);

  const startTime = meeting.start_time ? new Date(meeting.start_time) : null;
  const timeUntil = startTime ? Math.round((startTime.getTime() - Date.now()) / 60000) : null;

  return (
    <div className="tool-panel">
      <div className="tool-panel__header">
        <div className="badge badge--ghost badge--pill">
          <CheckSquare size={14} />
          Trạng thái chuẩn bị
        </div>
        {timeUntil !== null && timeUntil > 0 && (
          <span className="meta-chip">
            <Clock size={12} />
            Còn {timeUntil < 60 ? `${timeUntil} phút` : `${Math.round(timeUntil / 60)} giờ`}
          </span>
        )}
      </div>
      <div className="prep-status-grid">
        <div className={`prep-status-item ${agendaCount > 0 ? 'prep-status-item--done' : ''}`}>
          <Calendar size={14} />
          <span>Agenda</span>
          <span className="prep-status-item__count">{agendaCount}</span>
        </div>
        <div className={`prep-status-item ${participants.length > 1 ? 'prep-status-item--done' : ''}`}>
          <Users size={14} />
          <span>Thành viên</span>
          <span className="prep-status-item__count">{participants.length}</span>
        </div>
        <div className={`prep-status-item ${docCount > 0 ? 'prep-status-item--done' : ''}`}>
          <FileText size={14} />
          <span>Tài liệu</span>
          <span className="prep-status-item__count">{docCount}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PARTICIPANTS PANEL - Compact list
// ============================================
const ParticipantsPanel = ({ meeting, onRefresh }: { meeting: MeetingWithParticipants; onRefresh: () => void }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const participants = meeting.participants || [];

  useEffect(() => {
    if (showAddModal) fetchUsers();
  }, [showAddModal, searchQuery]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { usersApi } = await import('../../../../lib/api/users');
      const response = await usersApi.list({ search: searchQuery || undefined });
      const existingIds = new Set(participants.map((p: any) => p.user_id));
      setAvailableUsers(response.users.filter((u: any) => !existingIds.has(u.id)));
    } catch {
      setAvailableUsers([
        { id: 'user-1', email: 'nguyenvana@lpbank.vn', display_name: 'Nguyễn Văn A', department_name: 'PMO' },
        { id: 'user-2', email: 'tranthib@lpbank.vn', display_name: 'Trần Thị B', department_name: 'IT' },
      ]);
    } finally {
      setIsLoading(false);
    }
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tool-panel">
      <div className="tool-panel__header">
        <div className="badge badge--ghost badge--pill">
          <Users size={14} />
          Thành viên ({participants.length})
        </div>
        <button className="btn btn--ghost btn--sm" onClick={() => setShowAddModal(true)}>
          <UserPlus size={14} />
        </button>
      </div>
      <div className="tool-panel__list">
        {participants.slice(0, 5).map((p: any) => (
          <div key={p.user_id || p.id} className="participant-compact">
            <div className="participant-compact__avatar">
              {(p.display_name || p.email || '?').charAt(0)}
            </div>
            <div className="participant-compact__info">
              <span className="participant-compact__name">{p.display_name || p.email}</span>
              <span className={`badge badge--${p.role === 'organizer' ? 'accent' : 'neutral'}`} style={{ fontSize: '9px' }}>
                {p.role === 'organizer' ? 'Chủ trì' : p.role === 'chair' ? 'Chủ tọa' : 'Thành viên'}
              </span>
            </div>
          </div>
        ))}
        {participants.length > 5 && (
          <div className="participant-compact participant-compact--more">
            +{participants.length - 5} người khác
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal__header">
              <h2 className="modal__title"><UserPlus size={18} /> Thêm thành viên</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div style={{ position: 'relative', marginBottom: 'var(--space-md)' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tìm theo tên..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                ) : availableUsers.map(user => (
                  <label key={user.id} className="participant-select-item" style={{ marginBottom: 'var(--space-xs)' }}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => {
                        const newSet = new Set(selectedUsers);
                        if (newSet.has(user.id)) newSet.delete(user.id);
                        else newSet.add(user.id);
                        setSelectedUsers(newSet);
                      }}
                    />
                    <div className="participant-compact__avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                      {user.display_name?.charAt(0) || '?'}
                    </div>
                    <span style={{ flex: 1, fontSize: '13px' }}>{user.display_name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
              <button className="btn btn--primary" onClick={handleAddParticipants} disabled={selectedUsers.size === 0 || isLoading}>
                <UserPlus size={14} />
                Thêm ({selectedUsers.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// DOCUMENTS PANEL - Compact list
// ============================================
const DocumentsPanel = ({ meetingId }: { meetingId: string }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', file_type: 'pdf' });
  const [isUploading, setIsUploading] = useState(false);

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
      });
      setNewDoc({ title: '', file_type: 'pdf' });
      setShowUpload(false);
      loadDocuments();
    } catch (err) {
      console.error('Failed to upload:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="tool-panel">
      <div className="tool-panel__header">
        <div className="badge badge--ghost badge--pill">
          <FileText size={14} />
          Tài liệu ({documents.length})
        </div>
        <button className="btn btn--ghost btn--sm" onClick={() => setShowUpload(!showUpload)}>
          <Upload size={14} />
        </button>
      </div>

      {showUpload && (
        <div className="doc-upload-inline">
          <input
            type="text"
            placeholder="Tên tài liệu..."
            value={newDoc.title}
            onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
            className="doc-upload-inline__input"
          />
          <select 
            value={newDoc.file_type}
            onChange={e => setNewDoc({ ...newDoc, file_type: e.target.value })}
            className="doc-upload-inline__select"
          >
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="xlsx">XLSX</option>
          </select>
          <button 
            className="btn btn--primary btn--sm" 
            onClick={handleUpload}
            disabled={!newDoc.title.trim() || isUploading}
          >
            {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          </button>
        </div>
      )}

      <div className="tool-panel__list">
        {isLoading ? (
          <div className="empty-state empty-state--inline">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : documents.length > 0 ? (
          documents.slice(0, 4).map(doc => (
            <div key={doc.id} className="tool-card tool-card--compact">
              <div className="tool-card__icon">
                <FileText size={14} />
              </div>
              <div className="tool-card__body">
                <div className="tool-card__title">{doc.title}</div>
                <div className="tool-card__detail">{doc.file_type.toUpperCase()}</div>
              </div>
              <a href={doc.file_url || '#'} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--icon btn--sm">
                <ExternalLink size={12} />
              </a>
            </div>
          ))
        ) : (
          <div className="empty-state empty-state--inline">Chưa có tài liệu</div>
        )}
      </div>
    </div>
  );
};

// ============================================
// AI ASSISTANT PANEL - Compact chat
// ============================================
const AIAssistantPanel = ({ meetingId }: { meetingId: string }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const suggestedQuestions = [
    'Những điểm chính cần thảo luận?',
    'Rủi ro tiềm ẩn của dự án?',
    'Policy liên quan cần biết?',
  ];

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await aiApi.sendMessage(query, meetingId);
      setResponse(result.message);
    } catch (err) {
      setResponse('Xin lỗi, không thể trả lời lúc này.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tool-panel">
      <div className="tool-panel__header">
        <div className="badge badge--ghost badge--pill">
          <Sparkles size={14} />
          MeetMate AI
        </div>
        {response && (
          <button className="btn btn--ghost btn--sm" onClick={() => setResponse(null)}>
            <X size={12} />
          </button>
        )}
      </div>
      <div className="ai-assistant-compact">
        {response ? (
          <div className="ai-response-compact">
            <Bot size={14} />
            <p>{response}</p>
          </div>
        ) : (
          <div className="ai-suggestions-compact">
            {suggestedQuestions.map((q, i) => (
              <button 
                key={i} 
                className="ai-suggestion-chip"
                onClick={() => setQuery(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="ai-input-compact">
          <input
            type="text"
            placeholder="Hỏi về cuộc họp..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button 
            className="btn btn--primary btn--icon btn--sm" 
            onClick={handleSend}
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreMeetTab;
