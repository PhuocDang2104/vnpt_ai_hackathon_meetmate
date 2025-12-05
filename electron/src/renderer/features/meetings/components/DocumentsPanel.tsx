import { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  ExternalLink,
  Check,
  X,
  Loader2,
  FolderOpen,
  Link as LinkIcon,
} from 'lucide-react';
import { aiApi } from '../../../lib/api/ai';
import type { PrereadDocument, MeetingSuggestion } from '../../../shared/dto/ai';
import { SOURCE_ICONS } from '../../../shared/dto/ai';

interface DocumentsPanelProps {
  meetingId: string;
}

export const DocumentsPanel = ({ meetingId }: DocumentsPanelProps) => {
  const [documents, setDocuments] = useState<PrereadDocument[]>([]);
  const [suggestions, setSuggestions] = useState<MeetingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSuggested, setHasSuggested] = useState(false);

  const handleSuggest = async () => {
    setIsLoading(true);
    try {
      const [docsResponse, suggestionsResponse] = await Promise.all([
        aiApi.suggestDocuments(meetingId),
        aiApi.getSuggestions(meetingId),
      ]);
      setDocuments(docsResponse.documents);
      setSuggestions(suggestionsResponse.suggestions.filter(s => s.suggestion_type === 'document'));
      setHasSuggested(true);
    } catch (err) {
      console.error('Failed to get suggestions:', err);
      // Mock data
      setDocuments([
        {
          id: '1',
          meeting_id: meetingId,
          title: 'Project Charter - Core Banking Modernization',
          source: 'SharePoint',
          url: 'https://lpbank.sharepoint.com/docs/charter.pdf',
          snippet: 'Tài liệu Project Charter định nghĩa scope, objectives...',
          relevance_score: 0.95,
          status: 'suggested',
        },
        {
          id: '2',
          meeting_id: meetingId,
          title: 'Technical Architecture Document v2.1',
          source: 'SharePoint',
          url: 'https://lpbank.sharepoint.com/docs/arch.pdf',
          snippet: 'Kiến trúc kỹ thuật bao gồm system design...',
          relevance_score: 0.92,
          status: 'suggested',
        },
        {
          id: '3',
          meeting_id: meetingId,
          title: 'NHNN Circular 09/2020',
          source: 'Wiki',
          url: 'https://wiki.lpbank.vn/compliance',
          snippet: 'Thông tư quy định về quản lý rủi ro CNTT...',
          relevance_score: 0.88,
          status: 'suggested',
        },
      ]);
      setHasSuggested(true);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDocStatus = (docId: string, status: 'accepted' | 'ignored') => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, status } : doc
    ));
  };

  const acceptedDocs = documents.filter(d => d.status === 'accepted');
  const suggestedDocs = documents.filter(d => d.status === 'suggested');

  return (
    <div className="documents-panel">
      <div className="panel-header">
        <h3 className="panel-title">Tài liệu Pre-read</h3>
        <div className="panel-actions">
          <button className="btn btn--secondary btn--sm">
            <Upload size={14} />
            Tải lên
          </button>
          <button
            className="btn btn--accent btn--sm"
            onClick={handleSuggest}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="spinner" />
                Đang tìm...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                AI Gợi ý tài liệu
              </>
            )}
          </button>
        </div>
      </div>

      {/* Accepted Documents */}
      {acceptedDocs.length > 0 && (
        <div className="document-section">
          <h4 className="document-section__title">
            <Check size={14} />
            Tài liệu đã chọn ({acceptedDocs.length})
          </h4>
          <div className="document-list">
            {acceptedDocs.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onAccept={() => {}}
                onIgnore={() => updateDocStatus(doc.id, 'suggested')}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestedDocs.length > 0 && (
        <div className="document-section">
          <h4 className="document-section__title">
            <Sparkles size={14} />
            AI Gợi ý ({suggestedDocs.length})
          </h4>
          <div className="document-list">
            {suggestedDocs.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onAccept={() => updateDocStatus(doc.id, 'accepted')}
                onIgnore={() => updateDocStatus(doc.id, 'ignored')}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && !isLoading && (
        <div className="empty-state">
          <FolderOpen className="empty-state__icon" />
          <h3 className="empty-state__title">Chưa có tài liệu</h3>
          <p className="empty-state__description">
            Bấm "AI Gợi ý tài liệu" để MeetMate tìm các tài liệu liên quan từ SharePoint, Wiki, và các nguồn nội bộ
          </p>
        </div>
      )}
    </div>
  );
};

// Document Card Component
interface DocumentCardProps {
  document: PrereadDocument;
  onAccept: () => void;
  onIgnore: () => void;
  showActions: boolean;
}

const DocumentCard = ({ document, onAccept, onIgnore, showActions }: DocumentCardProps) => {
  return (
    <div className="document-card">
      <div className="document-card__icon">
        {SOURCE_ICONS[document.source] || '📄'}
      </div>
      <div className="document-card__content">
        <div className="document-card__header">
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="document-card__title"
          >
            {document.title}
            <ExternalLink size={12} />
          </a>
          <span className="document-card__source">{document.source}</span>
        </div>
        <p className="document-card__snippet">{document.snippet}</p>
        <div className="document-card__footer">
          <span className="document-card__score">
            Độ phù hợp: {Math.round(document.relevance_score * 100)}%
          </span>
        </div>
      </div>
      {showActions && (
        <div className="document-card__actions">
          <button className="btn btn--icon btn--success" onClick={onAccept} title="Chấp nhận">
            <Check size={16} />
          </button>
          <button className="btn btn--icon btn--muted" onClick={onIgnore} title="Bỏ qua">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentsPanel;

