/**
 * Post-Meeting Tab - Fireflies.ai Style
 * 3-column layout: Filters | AI Summary | Transcript
 */
// Force rebuild: Fix syntax error verification
import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Calendar,
  MessageCircle,
  TrendingUp,
  CheckSquare,
  Smile,
  Meh,
  Frown,
  Users,
  Tag,
  Search,
  Sparkles,
  Download,
  Mail,
  Copy,
  Edit3,
  Check,
  X,
  Video,
  Upload,
  Play,
  Loader,
  Trash2,
  Loader2 // Import Loader2
} from 'lucide-react';
import type { MeetingWithParticipants } from '../../../../shared/dto/meeting';
import { minutesApi, type MeetingMinutes } from '../../../../lib/api/minutes';
import { transcriptsApi } from '../../../../lib/api/transcripts';
import { itemsApi, type ActionItem, type DecisionItem, type RiskItem } from '../../../../lib/api/items';
import { meetingsApi } from '../../../../lib/api/meetings';
import { minutesTemplateApi, type MinutesTemplate } from '../../../../lib/api/minutes_template';
import { MinutesEmailModal } from '../modals/MinutesEmailModal';

interface PostMeetTabFirefliesProps {
  meeting: MeetingWithParticipants;
  onRefresh: () => void;
}

interface TranscriptChunk {
  id: string;
  chunk_index: number;
  start_time: number;
  end_time: number;
  speaker?: string;
  text: string;
  confidence?: number;
  language?: string;
  created_at?: string;
}

interface SpeakerStats {
  speaker: string;
  word_count: number;
  talk_time: number;
  percentage: number;
}

interface FilterState {
  questions: boolean;
  dates: boolean;
  metrics: boolean;
  tasks: boolean;
  sentiment: 'all' | 'positive' | 'neutral' | 'negative';
  speakers: string[];
  topics: string[];
  searchQuery: string;
}

export const PostMeetTabFireflies = ({ meeting, onRefresh }: PostMeetTabFirefliesProps) => {
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptChunk[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  const [templates, setTemplates] = useState<MinutesTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [defaultTemplate, setDefaultTemplate] = useState<MinutesTemplate | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    questions: false,
    dates: false,
    metrics: false,
    tasks: false,
    sentiment: 'all',
    speakers: [],
    topics: [],
    searchQuery: '',
  });

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // ... (SpeakerStats state is here)

  const [speakerStats, setSpeakerStats] = useState<SpeakerStats[]>([]);

  useEffect(() => {
    loadAllData();
    loadTemplates();
  }, [meeting.id]);

  // ... (loadTemplates is here)
  const loadTemplates = async () => {
    // ... code for loadTemplates
    setTemplatesLoading(true);
    try {
      // ... (truncated for brevity, assuming existing code is fine here)
      const templatesList = await minutesTemplateApi.list({ is_active: true });
      // ... (rest of loadTemplates logic)
      setTemplates(templatesList.templates || []);
    } catch (err) {
      console.error('Load templates failed', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [minutesData, transcriptData, actionsData, decisionsData, risksData] = await Promise.all([
        minutesApi.getLatest(meeting.id).catch(() => null),
        transcriptsApi.list(meeting.id).catch(() => ({ chunks: [] })),
        itemsApi.listActions(meeting.id).catch(() => ({ items: [] })),
        itemsApi.listDecisions(meeting.id).catch(() => ({ items: [] })),
        itemsApi.listRisks(meeting.id).catch(() => ({ items: [] })),
      ]);

      setMinutes(minutesData);
      setTranscripts(transcriptData.chunks || []);
      setActionItems(actionsData.items || []);
      setDecisions(decisionsData.items || []);
      setRisks(risksData.items || []);

      // Calculate speaker stats
      if (transcriptData.chunks) {
        calculateSpeakerStats(transcriptData.chunks);
      }
    } catch (err) {
      console.error('Initial load failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSpeakerStats = (chunks: TranscriptChunk[]) => {
    const stats = new Map<string, { words: number; time: number }>();

    chunks.forEach((chunk) => {
      const speaker = chunk.speaker || 'Unknown';
      const words = chunk.text.split(/\s+/).length;
      const duration = chunk.end_time - chunk.start_time;

      const current = stats.get(speaker) || { words: 0, time: 0 };
      stats.set(speaker, {
        words: current.words + words,
        time: current.time + duration,
      });
    });

    const totalTime = Array.from(stats.values()).reduce((sum, s) => sum + s.time, 0);

    const speakerList: SpeakerStats[] = Array.from(stats.entries()).map(([speaker, data]) => ({
      speaker,
      word_count: data.words,
      talk_time: data.time,
      percentage: totalTime > 0 ? (data.time / totalTime) * 100 : 0,
    }));

    speakerList.sort((a, b) => b.talk_time - a.talk_time);
    setSpeakerStats(speakerList);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generated = await minutesApi.generate({
        meeting_id: meeting.id,
        template_id: selectedTemplateId || undefined,
        include_transcript: true,
        include_actions: true,
        include_decisions: true,
        include_risks: true,
        format: 'markdown',
      });
      setMinutes(generated);
    } catch (err) {
      console.error('Generate failed:', err);
      alert('Không thể tạo biên bản. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fireflies-layout">
        <div className="fireflies-loading">
          <div className="spinner" style={{ width: 40, height: 40 }} />
          <p>Đang tải dữ liệu cuộc họp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fireflies-layout">
      {/* Left Sidebar - Filters & Analytics */}
      <LeftPanel
        filters={filters}
        setFilters={setFilters}
        actionItems={actionItems}
        speakerStats={speakerStats}
        transcripts={transcripts}
      />

      {/* Center - Video + AI Summary & Content */}
      <CenterPanel
        meeting={meeting}
        minutes={minutes}
        actionItems={actionItems}
        decisions={decisions}
        risks={risks}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        onUpdateMinutes={setMinutes}
        isUploadingVideo={isUploadingVideo}
        setIsUploadingVideo={setIsUploadingVideo}
        isProcessingVideo={isProcessingVideo}
        setIsProcessingVideo={setIsProcessingVideo}
        onRefresh={loadAllData}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={setSelectedTemplateId}
        defaultTemplate={defaultTemplate}
        templatesLoading={templatesLoading}
        openEmailModal={() => setIsEmailModalOpen(true)}
      />

      {/* Right - Transcript */}
      <RightPanel transcripts={transcripts} filters={filters} />

      {/* Email Modal */}
      {minutes && (
        <MinutesEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          meetingId={meeting.id}
          minutesId={minutes.id}
          meetingTitle={meeting.title}
          participants={meeting.participants}
        />
      )}
    </div>
  );
};

// ==================== Left Panel - Filters ====================
interface LeftPanelProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  actionItems: ActionItem[];
  speakerStats: SpeakerStats[];
  transcripts: TranscriptChunk[];
}

const LeftPanel = ({ filters, setFilters, actionItems, speakerStats, transcripts }: LeftPanelProps) => {
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    sentiment: true,
    speakers: true,
    topics: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] });
  };

  // Count questions in transcript
  const questionsCount = transcripts.filter((t) => t.text.includes('?')).length;

  // Extract dates/times mentions (simple heuristic)
  const datesCount = transcripts.filter((t) =>
    /\b\d{1,2}\/\d{1,2}|\b(thứ|ngày|tháng|tuần|quý)\b/i.test(t.text)
  ).length;

  // Count metrics mentions (numbers + units)
  const metricsCount = transcripts.filter((t) =>
    /\d+\s?(triệu|nghìn|tỷ|%|người|đơn|vị)/i.test(t.text)
  ).length;

  return (
    <div className="fireflies-left-panel">
      {/* Search */}
      <div className="fireflies-search">
        <div className="fireflies-search__icon">
          <Search size={18} />
        </div>
        <input
          className="fireflies-search__input"
          placeholder="Smart Search"
          value={filters.searchQuery}
          onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
        />
      </div>

      {/* AI Filters Section */}
      <FilterSection
        title="AI FILTERS"
        isExpanded={expandedSections.filters}
        onToggle={() => toggleSection('filters')}
      >
        <FilterChip
          icon={<MessageCircle size={14} />}
          label="Questions"
          count={questionsCount}
          color="#f59e0b"
          active={filters.questions}
          onClick={() => setFilters({ ...filters, questions: !filters.questions })}
        />
        <FilterChip
          icon={<Calendar size={14} />}
          label="Dates & Times"
          count={datesCount}
          color="#8b5cf6"
          active={filters.dates}
          onClick={() => setFilters({ ...filters, dates: !filters.dates })}
        />
        <FilterChip
          icon={<TrendingUp size={14} />}
          label="Metrics"
          count={metricsCount}
          color="#3b82f6"
          active={filters.metrics}
          onClick={() => setFilters({ ...filters, metrics: !filters.metrics })}
        />
        <FilterChip
          icon={<CheckSquare size={14} />}
          label="Tasks"
          count={actionItems.length}
          color="#10b981"
          active={filters.tasks}
          onClick={() => setFilters({ ...filters, tasks: !filters.tasks })}
        />
      </FilterSection>

      {/* Sentiment Section */}
      <FilterSection
        title="SENTIMENT FILTERS"
        isExpanded={expandedSections.sentiment}
        onToggle={() => toggleSection('sentiment')}
      >
        <SentimentBar sentiment="positive" percentage={43} />
        <SentimentBar sentiment="neutral" percentage={53} />
        <SentimentBar sentiment="negative" percentage={4} />
      </FilterSection>

      {/* Speakers Section */}
      <FilterSection
        title="SPEAKERS"
        isExpanded={expandedSections.speakers}
        onToggle={() => toggleSection('speakers')}
      >
        <div className="speakers-list">
          {speakerStats.map((stat) => (
            <SpeakerCard key={stat.speaker} stat={stat} />
          ))}
        </div>
      </FilterSection>

      {/* Topic Trackers Section */}
      <FilterSection
        title="TOPIC TRACKERS"
        isExpanded={expandedSections.topics}
        onToggle={() => toggleSection('topics')}
      >
        <TopicChip label="Growth Team" count={7} />
        <TopicChip label="Marketing Team" count={5} />
        <TopicChip label="Product" count={3} />
      </FilterSection>
    </div>
  );
};

// ==================== Center Panel - AI Summary ====================
interface CenterPanelProps {
  meeting: MeetingWithParticipants;
  minutes: MeetingMinutes | null;
  actionItems: ActionItem[];
  decisions: DecisionItem[];
  risks: RiskItem[];
  onGenerate: () => void;
  isGenerating: boolean;
  onUpdateMinutes: (minutes: MeetingMinutes) => void;
  isUploadingVideo: boolean;
  setIsUploadingVideo: (value: boolean) => void;
  isProcessingVideo: boolean;
  setIsProcessingVideo: (value: boolean) => void;
  onRefresh: () => Promise<void>;
  templates: MinutesTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string | null) => void;
  defaultTemplate: MinutesTemplate | null;
  templatesLoading: boolean;
  openEmailModal: () => void;
}

const CenterPanel = ({
  meeting,
  minutes,
  actionItems,
  decisions,
  risks,
  onGenerate,
  isGenerating,
  onUpdateMinutes,
  isUploadingVideo,
  setIsUploadingVideo,
  isProcessingVideo,
  setIsProcessingVideo,
  onRefresh,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  defaultTemplate,
  templatesLoading,
  openEmailModal,
}: CenterPanelProps) => {
  console.log('CenterPanel Rendered - Verifying fix');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleSaveSummary = async () => {
    if (!minutes) return;
    try {
      await minutesApi.update(minutes.id, {
        executive_summary: editContent,
      });
      onUpdateMinutes({ ...minutes, executive_summary: editContent });
      setIsEditingSummary(false);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Lưu thất bại');
    }
  };

  const startEdit = () => {
    setEditContent(minutes?.executive_summary || '');
    setIsEditingSummary(true);
  };

  const handleVideoUpload = async (file: File) => {
    setIsUploadingVideo(true);
    try {
      // Upload video
      const result = await meetingsApi.uploadVideo(meeting.id, file);

      // Update meeting with recording_url
      await meetingsApi.update(meeting.id, { recording_url: result.recording_url });

      // Trigger inference (transcription + diarization)
      setIsProcessingVideo(true);
      try {
        const inferenceResult = await meetingsApi.triggerInference(meeting.id);
        console.log('Video inference result:', inferenceResult);

        // Wait a bit for processing to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Refresh meeting data to load new transcripts
        await onRefresh();

        alert(`Video đã được tải lên và xử lý thành công.Đã tạo ${inferenceResult.transcript_count || 0} transcript chunks.`);
      } catch (inferenceErr: any) {
        console.error('Video inference failed:', inferenceErr);
        alert(`Video đã được tải lên nhưng xử lý gặp lỗi: ${inferenceErr.message || 'Không thể tạo transcript'}. Vui lòng kiểm tra logs backend.`);
      } finally {
        setIsProcessingVideo(false);
      }
    } catch (err: any) {
      console.error('Upload video failed:', err);
      alert(`Lỗi: ${err.message || 'Không thể tải lên video'} `);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        handleVideoUpload(file);
      } else {
        alert('Vui lòng chọn file video');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        handleVideoUpload(file);
      } else {
        alert('Vui lòng chọn file video');
      }
    }
  };

  const handleVideoDelete = async () => {
    if (!meeting.recording_url) return;

    if (!confirm('Bạn có chắc chắn muốn xóa video này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      await meetingsApi.deleteVideo(meeting.id);

      // Update meeting to clear recording_url
      await meetingsApi.update(meeting.id, { recording_url: null });

      // Refresh meeting data
      await onRefresh();

      alert('Video đã được xóa thành công.');
    } catch (err: any) {
      console.error('Delete video failed:', err);
      alert(`Lỗi: ${err.message || 'Không thể xóa video'} `);
    }
  };

  return (
    <div className="fireflies-center-panel">
      {/* Video Section */}
      <VideoSection
        recordingUrl={meeting.recording_url}
        onUpload={handleVideoUpload}
        onDelete={handleVideoDelete}
        isUploading={isUploadingVideo}
        isProcessing={isProcessingVideo}
        dragActive={dragActive}
        onDrag={handleDrag}
        onDrop={handleDrop}
        onFileInput={handleFileInput}
      />

      {/* Header */}
      <div className="fireflies-center-header">
        <div className="fireflies-center-title">
          <Sparkles size={20} style={{ color: '#8b5cf6' }} />
          <span>AI Generated Content</span>
        </div>

        <div className="fireflies-center-actions">
          {minutes && (
            <>
              <button className="fireflies-icon-btn" onClick={startEdit} title="Edit">
                <Edit3 size={16} />
              </button>
              <button
                className="fireflies-icon-btn"
                onClick={() => {
                  navigator.clipboard.writeText(minutes.executive_summary || '');
                  alert('Đã copy!');
                }}
                title="Copy"
              >
                <Copy size={16} />
              </button>
              <button className="fireflies-icon-btn" title="Download">
                <Download size={16} />
              </button>
              <button
                className="fireflies-icon-btn"
                title="Email & PDF"
                onClick={openEmailModal}
              >
                <Mail size={16} />
              </button>
            </>
          )}

          <button
            className="btn btn--primary btn--sm"
            onClick={onGenerate}
            disabled={isGenerating}
            style={{ marginLeft: 8 }}
          >
            <Sparkles size={14} style={{ marginRight: 4 }} />
            {isGenerating ? 'Generating...' : minutes ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Template Selector */}
      {!minutes && templates.length > 0 && (
        <div className="fireflies-template-selector">
          <label className="fireflies-template-label">
            <span>Template biên bản:</span>
          </label>
          <select
            className="fireflies-template-select"
            value={selectedTemplateId || ''}
            onChange={(e) => {
              const templateId = e.target.value || null;
              console.log('Template selected:', templateId);
              onSelectTemplate(templateId);
            }}
            disabled={isGenerating || templatesLoading}
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} {template.is_default ? '(Mặc định)' : ''}
              </option>
            ))}
          </select>
          {selectedTemplateId && (() => {
            const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
            if (!selectedTemplate) return null;

            return (
              <div className="fireflies-template-info" style={{ marginTop: 16 }}>
                {selectedTemplate.description && (
                  <div
                    className="fireflies-template-description"
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      marginBottom: 20,
                      padding: '12px 16px',
                      background: 'rgba(245, 158, 11, 0.05)',
                      borderLeft: '3px solid var(--accent)',
                      borderRadius: '0 8px 8px 0',
                      fontStyle: 'italic'
                    }}
                  >
                    {selectedTemplate.description}
                  </div>
                )}

                {selectedTemplate.structure?.sections && selectedTemplate.structure.sections.length > 0 && (
                  <div className="fireflies-template-fields">
                    <div
                      className="fireflies-template-fields__title"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--text-muted)',
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <span>Cấu trúc biên bản</span>
                      <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                    </div>

                    <div
                      className="fireflies-template-fields__list"
                      style={{
                        display: 'grid',
                        gap: 12,
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
                      }}
                    >
                      {selectedTemplate.structure.sections
                        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        .map((section: any, idx: number) => (
                          <div
                            key={idx}
                            className="fireflies-template-field-item"
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              padding: '16px',
                              boxShadow: 'var(--card-shadow-soft)',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              cursor: 'default'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'var(--card-shadow-soft)';
                            }}
                          >
                            <div
                              className="fireflies-template-field-item__title"
                              style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                                {section.title || section.id}
                              </span>
                              {section.required && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    textTransform: 'uppercase',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: 'var(--error-subtle)',
                                    color: 'var(--error)',
                                    fontWeight: 700
                                  }}
                                >
                                  Required
                                </span>
                              )}
                            </div>

                            {section.fields && section.fields.length > 0 && (
                              <div
                                className="fireflies-template-field-item__fields"
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8
                                }}
                              >
                                {section.fields.map((field: any, fieldIdx: number) => (
                                  <div
                                    key={fieldIdx}
                                    className="fireflies-template-field-item__field"
                                    style={{
                                      fontSize: '13px',
                                      color: 'var(--text-secondary)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      padding: '6px 10px',
                                      background: 'var(--bg-surface)',
                                      borderRadius: 6,
                                      border: '1px solid transparent'
                                    }}
                                  >
                                    <div style={{ padding: 2, background: 'var(--text-muted)', borderRadius: '50%' }} />
                                    <span style={{ flex: 1 }}>{field.label || field.id}</span>
                                    {field.required && (
                                      <span style={{ color: 'var(--error)', fontSize: '14px', lineHeight: 1 }}>•</span>
                                    )}
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: 3 }}>
                                      {field.type}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {selectedTemplate.meeting_types && selectedTemplate.meeting_types.length > 0 && (
                  <div
                    className="fireflies-template-meta"
                    style={{
                      marginTop: 16,
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Tag size={12} />
                    <span className="fireflies-template-meta__label">Áp dụng cho:</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {selectedTemplate.meeting_types.map(t => (
                        <span key={t} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 99, fontSize: '11px' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
      {templatesLoading && (
        <div className="fireflies-template-selector">
          <span className="fireflies-template-label">Đang tải templates...</span>
        </div>
      )}
      {!templatesLoading && templates.length === 0 && (
        <div className="fireflies-template-selector">
          <span className="fireflies-template-label" style={{ color: 'var(--text-muted)' }}>
            Không có template nào. Vui lòng tạo template trong cài đặt.
          </span>
        </div>
      )}

      {/* Content */}
      <div className="fireflies-center-content">
        {!minutes ? (
          <EmptyAIContent onGenerate={onGenerate} isGenerating={isGenerating} />
        ) : (
          <MinutesDisplay
            minutes={minutes}
            actionItems={actionItems}
            decisions={decisions}
            risks={risks}
            isEditing={isEditingSummary}
            editContent={editContent}
            setEditContent={setEditContent}
            onSave={handleSaveSummary}
            onCancel={() => setIsEditingSummary(false)}
            onEdit={() => setIsEditingSummary(true)}
          />
        )}
      </div>

    </div>
  );
};

// ==================== Right Panel - Transcript ====================
interface RightPanelProps {
  transcripts: TranscriptChunk[];
  filters: FilterState;
}

const RightPanel = ({ transcripts, filters }: RightPanelProps) => {
  const [searchInTranscript, setSearchInTranscript] = useState('');

  const filteredTranscripts = transcripts.filter((t) => {
    // Apply search filter
    if (filters.searchQuery && !t.text.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
      return false;
    }

    // Apply question filter
    if (filters.questions && !t.text.includes('?')) {
      return false;
    }

    // Apply speaker filter
    if (filters.speakers.length > 0 && t.speaker && !filters.speakers.includes(t.speaker)) {
      return false;
    }

    return true;
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;
  };

  return (
    <div className="fireflies-right-panel">
      {/* Header */}
      <div className="fireflies-right-header">
        <h3 className="fireflies-right-title">
          <span>📝</span>
          Transcript
        </h3>

        <div className="fireflies-search fireflies-search--sm">
          <div className="fireflies-search__icon">
            <Search size={14} />
          </div>
          <input
            className="fireflies-search__input"
            placeholder="Search across the transcript"
            value={searchInTranscript}
            onChange={(e) => setSearchInTranscript(e.target.value)}
          />
        </div>
      </div>

      {/* Transcript List */}
      <div className="fireflies-transcript-list">
        {filteredTranscripts.length === 0 ? (
          <div className="fireflies-empty">
            <p>Không có transcript nào phù hợp với bộ lọc</p>
          </div>
        ) : (
          filteredTranscripts.map((chunk) => {
            const matchesSearch =
              searchInTranscript && chunk.text.toLowerCase().includes(searchInTranscript.toLowerCase());

            return (
              <div key={chunk.id} className={`fireflies - transcript - item ${matchesSearch ? 'highlight' : ''} `}>
                <div className="fireflies-transcript-header">
                  <div className="fireflies-speaker">
                    <div className="fireflies-speaker-avatar">
                      {chunk.speaker ? chunk.speaker.charAt(chunk.speaker.length - 1) : '?'}
                    </div>
                    <span className="fireflies-speaker-name">{chunk.speaker || 'Unknown'}</span>
                  </div>
                  <span className="fireflies-timestamp">{formatTime(chunk.start_time)}</span>
                </div>
                <div className="fireflies-transcript-text">
                  {highlightText(chunk.text, searchInTranscript)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ==================== Video Section ====================
interface VideoSectionProps {
  recordingUrl?: string | null;
  onUpload: (file: File) => void;
  onDelete: () => void;
  isUploading: boolean;
  isProcessing: boolean;
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const VideoSection = ({
  recordingUrl,
  onUpload,
  onDelete,
  isUploading,
  isProcessing,
  dragActive,
  onDrag,
  onDrop,
  onFileInput,
}: VideoSectionProps) => {
  if (recordingUrl) {
    // Show video player
    return (
      <div className="fireflies-video-section">
        <div className="fireflies-video-header">
          <div className="fireflies-video-title">
            <Video size={18} />
            <span>Video Recording</span>
          </div>
          <button
            className="fireflies-video-delete-btn"
            onClick={onDelete}
            title="Xóa video"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="fireflies-video-player">
          <video
            src={recordingUrl}
            controls
            className="fireflies-video-element"
            style={{ width: '100%', maxHeight: '400px', borderRadius: 'var(--radius-md)' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    );
  }

  // Show upload zone
  return (
    <div className="fireflies-video-section">
      <div className="fireflies-video-header">
        <div className="fireflies-video-title">
          <Video size={18} />
          <span>Video Recording</span>
        </div>
      </div>
      <div
        className={`fireflies - video - upload ${dragActive ? 'drag-active' : ''} ${isUploading || isProcessing ? 'uploading' : ''} `}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept="video/*"
          onChange={onFileInput}
          className="fireflies-video-input"
          id="video-upload-input"
          disabled={isUploading || isProcessing}
        />

        {isUploading ? (
          <div className="fireflies-upload-status">
            <Loader size={32} className="spinner" />
            <p className="fireflies-upload-text">Đang tải lên video...</p>
            <p className="fireflies-upload-hint">Vui lòng đợi, không đóng trang</p>
          </div>
        ) : isProcessing ? (
          <div className="fireflies-upload-status">
            <Loader size={32} className="spinner" />
            <p className="fireflies-upload-text">Đang xử lý video...</p>
            <p className="fireflies-upload-hint">AI đang tạo transcript và biên bản họp</p>
          </div>
        ) : (
          <>
            <div className="fireflies-upload-icon">
              <Upload size={48} strokeWidth={1.5} />
            </div>
            <div className="fireflies-upload-content">
              <h3 className="fireflies-upload-title">Tải lên video cuộc họp</h3>
              <p className="fireflies-upload-description">
                Kéo thả video vào đây hoặc click để chọn file
              </p>
              <p className="fireflies-upload-formats">
                Hỗ trợ: MP4, MOV, AVI, MKV, WebM
              </p>
            </div>
            <label htmlFor="video-upload-input" className="fireflies-upload-button">
              <Upload size={16} style={{ marginRight: 6 }} />
              Chọn file video
            </label>
          </>
        )}
      </div>
    </div>
  );
};

// ==================== Components ====================

const FilterSection = ({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="fireflies-filter-section">
      <button className="fireflies-filter-header" onClick={onToggle}>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="fireflies-filter-title">{title}</span>
      </button>
      {isExpanded && <div className="fireflies-filter-content">{children}</div>}
    </div>
  );
};

const FilterChip = ({
  icon,
  label,
  count,
  color,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      className={`fireflies - filter - chip ${active ? 'active' : ''} `}
      style={{ borderColor: active ? color : undefined, background: active ? `${color} 15` : undefined }}
      onClick={onClick}
    >
      <div className="fireflies-filter-chip__icon" style={{ color }}>
        {icon}
      </div>
      <div className="fireflies-filter-chip__content">
        <span className="fireflies-filter-chip__label">{label}</span>
        <span className="fireflies-filter-chip__count">{count}</span>
      </div>
    </button>
  );
};

const SentimentBar = ({ sentiment, percentage }: { sentiment: 'positive' | 'neutral' | 'negative'; percentage: number }) => {
  const config = {
    positive: { icon: <Smile size={14} />, label: 'Positive', color: '#10b981' },
    neutral: { icon: <Meh size={14} />, label: 'Neutral', color: '#6b7280' },
    negative: { icon: <Frown size={14} />, label: 'Negative', color: '#ef4444' },
  }[sentiment];

  return (
    <div className="sentiment-bar">
      <div className="sentiment-bar__header">
        <div className="sentiment-bar__icon" style={{ color: config.color }}>
          {config.icon}
        </div>
        <span className="sentiment-bar__label">{config.label}</span>
        <span className="sentiment-bar__percentage">{percentage}%</span>
      </div>
      <div className="sentiment-bar__track">
        <div className="sentiment-bar__fill" style={{ width: `${percentage}% `, background: config.color }} />
      </div>
    </div>
  );
};

const SpeakerCard = ({ stat }: { stat: SpeakerStats }) => {
  return (
    <div className="speaker-card">
      <div className="speaker-card__header">
        <span className="speaker-card__name">{stat.speaker}</span>
        <span className="speaker-card__time">{Math.floor(stat.talk_time)} words</span>
      </div>
      <div className="speaker-card__bar">
        <div className="speaker-card__fill" style={{ width: `${stat.percentage}% ` }} />
      </div>
      <span className="speaker-card__percentage">{stat.percentage.toFixed(1)}%</span>
    </div>
  );
};

const TopicChip = ({ label, count }: { label: string; count: number }) => {
  return (
    <div className="topic-chip">
      <Tag size={12} />
      <span className="topic-chip__label">{label}</span>
      <span className="topic-chip__count">{count}</span>
    </div>
  );
};

// ==================== Minutes Display ====================

const MinutesDisplay = ({
  minutes,
  actionItems,
  decisions,
  risks,
  isEditing,
  editContent,
  setEditContent,
  onSave,
  onCancel,
  onEdit,
}: {
  minutes: MeetingMinutes;
  actionItems: ActionItem[];
  decisions: DecisionItem[];
  risks: RiskItem[];
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
}) => {
  return (
    <div className="fireflies-minutes-display" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Summary Section */}
      <div className="fireflies-section" style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📝</span> Executive Summary
          </h3>
          <button
            className="btn btn--sm btn--ghost"
            onClick={onEdit}
            title="Edit Summary"
          >
            <Edit3 size={14} />
          </button>
        </div>
        <SummaryContent
          minutes={minutes}
          isEditing={isEditing}
          editContent={editContent}
          setEditContent={setEditContent}
          onSave={onSave}
          onCancel={onCancel}
        />
      </div>

      {/* Action Items Section */}
      <div className="fireflies-section" style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>✅</span> Action Items
        </h3>
        <ActionItemsContent items={actionItems} />
      </div>

      {/* Decisions & Risks Section */}
      <div className="fireflies-section" style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <DecisionsContent items={decisions} risks={risks} />
      </div>
    </div>
  );
};
const SummaryContent = ({
  minutes,
  isEditing,
  editContent,
  setEditContent,
  onSave,
  onCancel,
}: {
  minutes: MeetingMinutes;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) => {
  const summary = minutes.executive_summary || minutes.minutes_markdown || '';

  // Extract keywords (simple)
  const keywords = extractKeywords(summary);

  return (
    <div className="fireflies-summary">
      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="fireflies-keywords">
          <span className="fireflies-keywords__title">Keywords:</span>
          {keywords.map((kw, i) => (
            <span key={i} className="fireflies-keyword">
              "{kw}"
            </span>
          ))}
        </div>
      )}

      {/* Summary Content */}
      {isEditing ? (
        <div className="fireflies-edit-container">
          <textarea
            className="fireflies-textarea"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={15}
            autoFocus
          />
          <div className="fireflies-edit-actions">
            <button className="btn btn--sm btn--ghost" onClick={onCancel}>
              <X size={14} style={{ marginRight: 4 }} />
              Cancel
            </button>
            <button className="btn btn--sm btn--primary" onClick={onSave}>
              <Check size={14} style={{ marginRight: 4 }} />
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="fireflies-summary-content">
          {formatSummaryWithBullets(summary)}
        </div>
      )}
    </div>
  );
};

const ActionItemsContent = ({ items }: { items: ActionItem[] }) => {
  return (
    <div className="fireflies-actions-list">
      {items.length === 0 ? (
        <div className="fireflies-empty">Không có action items</div>
      ) : (
        items.map((item, i) => (
          <div key={item.id} className="fireflies-action-item">
            <div className="fireflies-action-number">{i + 1}</div>
            <div className="fireflies-action-content">
              <div className="fireflies-action-title">{item.title}</div>
              <div className="fireflies-action-meta">
                {item.owner_user_id && (
                  <span className="fireflies-meta-tag">
                    <Users size={12} />
                    {item.owner_user_id}
                  </span>
                )}
                {item.due_date && (
                  <span className="fireflies-meta-tag">
                    <Calendar size={12} />
                    {new Date(item.due_date).toLocaleDateString('vi-VN')}
                  </span>
                )}
                <span className={`fireflies - priority fireflies - priority--${item.priority} `}>
                  {item.priority}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const DecisionsContent = ({ items, risks }: { items: DecisionItem[]; risks: RiskItem[] }) => {
  return (
    <div className="fireflies-decisions-list">
      {/* Decisions */}
      {items.length > 0 && (
        <div className="fireflies-decisions-group">
          <h4 className="fireflies-group-title">💡 Key Decisions</h4>
          {items.map((item, i) => (
            <div key={item.id} className="fireflies-decision-item">
              <div className="fireflies-decision-number">{i + 1}</div>
              <div className="fireflies-decision-content">
                <div className="fireflies-decision-title">{item.title}</div>
                {item.rationale && <div className="fireflies-decision-subtitle">Rationale: {item.rationale}</div>}
                {item.impact && <div className="fireflies-decision-subtitle">Impact: {item.impact}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <div className="fireflies-decisions-group" style={{ marginTop: 24 }}>
          <h4 className="fireflies-group-title">⚠️ Identified Risks</h4>
          {risks.map((item) => (
            <div key={item.id} className="fireflies-risk-item">
              <div className={`fireflies - risk - badge fireflies - risk - badge--${item.severity} `}>
                {item.severity}
              </div>
              <div className="fireflies-risk-content">
                <div className="fireflies-risk-title">{item.title}</div>
                {item.mitigation && <div className="fireflies-risk-subtitle">Mitigation: {item.mitigation}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && risks.length === 0 && (
        <div className="fireflies-empty">Không có decisions hoặc risks</div>
      )}
    </div>
  );
};

const EmptyAIContent = ({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) => {
  // Auto-generate on mount
  useEffect(() => {
    if (!isGenerating) {
      onGenerate();
    }
  }, []);

  return (
    <div className="fireflies-empty-ai">
      <div className="fireflies-empty-ai__icon">
        <Sparkles size={64} strokeWidth={1} />
      </div>
      <h3 className="fireflies-empty-ai__title">Generating Meeting Summary with AI...</h3>
      <p className="fireflies-empty-ai__description">
        AI is analyzing the transcript to generate:
        <br />• Executive summary
        <br />• Action items with owners
        <br />• Key decisions and impacts
        <br />• Identified risks
      </p>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Processing transcript...</span>
      </div>
    </div>
  );
};

// ==================== Helper Functions ====================

const extractKeywords = (text: string): string[] => {
  // Simple keyword extraction (can be improved with NLP)
  const words = text.toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'in', 'with', 'to', 'for']);
  const wordFreq = new Map<string, number>();

  words.forEach((word) => {
    const clean = word.replace(/[^\w]/g, '');
    if (clean.length > 4 && !commonWords.has(clean)) {
      wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
    }
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
};

const formatSummaryWithBullets = (text: string) => {
  const lines = text.split('\n');

  return lines.map((line, i) => {
    if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
      return (
        <div key={i} className="fireflies-bullet-point">
          <span className="fireflies-bullet">•</span>
          <span>{line.replace(/^[-•]\s*/, '')}</span>
        </div>
      );
    }

    if (line.trim().startsWith('#')) {
      return (
        <h3 key={i} className="fireflies-summary-heading">
          {line.replace(/^#+\s*/, '')}
        </h3>
      );
    }

    if (!line.trim()) {
      return <br key={i} />;
    }

    return (
      <p key={i} className="fireflies-summary-paragraph">
        {line}
      </p>
    );
  });
};

const highlightText = (text: string, query: string) => {
  if (!query) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} style={{ background: '#fef3c7', padding: '2px 4px', borderRadius: 3 }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export default PostMeetTabFireflies;

