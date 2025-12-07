import { useState, useEffect } from 'react'
import {
  Search,
  BookOpen,
  FileText,
  Bot,
  Send,
  ExternalLink,
  Clock,
  FolderOpen,
  Upload,
  Loader2,
  Plus,
  X,
  Trash2,
} from 'lucide-react'
import { knowledgeApi, type KnowledgeDocument, type RecentQuery } from '../../lib/api/knowledge'
import { Modal } from '../../components/ui/Modal'
import { FormField } from '../../components/ui/FormField'

const KnowledgeHub = () => {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<KnowledgeDocument[]>([])
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([])
  const [suggestedDocs, setSuggestedDocs] = useState<KnowledgeDocument[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoadingDocs(true)
    try {
      const [docs, recent] = await Promise.all([
        knowledgeApi.list({ limit: 10 }),
        knowledgeApi.getRecentQueries(5),
      ])
      setSuggestedDocs(docs.documents)
      setRecentQueries(recent.queries)
    } catch (err) {
      console.error('Failed to load knowledge data:', err)
    } finally {
      setIsLoadingDocs(false)
    }
  }

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    try {
      const result = await knowledgeApi.search({ query: query.trim() })
      setSearchResults(result.documents)
      // Refresh recent queries
      const recent = await knowledgeApi.getRecentQueries(5)
      setRecentQueries(recent.queries)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const displayDocs = searchResults.length > 0 ? searchResults : suggestedDocs

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Knowledge Hub</h1>
          <p className="page-header__subtitle">Tìm kiếm tài liệu và hỏi đáp với AI</p>
        </div>
        <button 
          className="btn btn--primary"
          onClick={() => setShowUploadModal(true)}
        >
          <Upload size={16} />
          Upload tài liệu
        </button>
      </div>

      {/* Search Section */}
      <div className="card mb-6">
        <div className="card__body">
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <Search size={20} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Hỏi AI về policies, tài liệu, hoặc thông tin từ các cuộc họp trước..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
            <button 
              className="btn btn--primary"
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
            >
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Tìm kiếm
            </button>
          </div>

          {/* Quick suggestions */}
          <div style={{ marginTop: 'var(--space-base)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gợi ý:</span>
            {['Data retention policy', 'KYC requirements', 'Security standards'].map(suggestion => (
              <button 
                key={suggestion}
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setQuery(suggestion)
                  setTimeout(() => handleSearch(), 100)
                }}
                style={{ fontSize: '12px' }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid--2">
        {/* Documents List */}
        <div>
          <div className="card mb-4">
            <div className="card__header">
              <h3 className="card__title">
                <BookOpen size={18} className="card__title-icon" />
                {searchResults.length > 0 ? `Kết quả tìm kiếm (${searchResults.length})` : 'Tài liệu phổ biến'}
              </h3>
            </div>
            <div className="card__body">
              {isLoadingDocs ? (
                <div className="section-loading">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Đang tải...</span>
                </div>
              ) : displayDocs.length === 0 ? (
                <div className="empty-state-mini">
                  <FileText size={24} />
                  <p>Không tìm thấy tài liệu</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {displayDocs.map((doc) => (
                    <div 
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-md)',
                        padding: 'var(--space-md)',
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-surface-hover)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-surface)'
                      }}
                      onClick={() => {
                        if (doc.file_url) {
                          window.open(doc.file_url, '_blank')
                        }
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        background: 'var(--accent-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <FileText size={18} className="text-accent" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{doc.title}</div>
                        {doc.description && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {doc.description}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: '4px' }}>
                          <FolderOpen size={12} />
                          {doc.source}
                          <span>•</span>
                          {doc.category || doc.document_type}
                          {doc.tags && doc.tags.length > 0 && (
                            <>
                              <span>•</span>
                              {doc.tags.slice(0, 2).join(', ')}
                            </>
                          )}
                        </div>
                      </div>
                      <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div>
          {/* Recent Queries */}
          <div className="card mb-4">
            <div className="card__header">
              <h3 className="card__title">
                <Clock size={18} className="card__title-icon" />
                Tìm kiếm gần đây
              </h3>
            </div>
            <div className="card__body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {recentQueries.length > 0 ? recentQueries.map((item, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-sm) var(--space-md)',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setQuery(item.query)
                      setTimeout(() => handleSearch(), 100)
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <Search size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '13px' }}>{item.query}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.timestamp}</span>
                  </div>
                )) : (
                  <div className="empty-state-mini">
                    <Clock size={24} />
                    <p>Chưa có tìm kiếm nào</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false)
          loadData()
        }}
      />
    </div>
  )
}

// Upload Document Modal Component
interface UploadDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const UploadDocumentModal = ({ isOpen, onClose, onSuccess }: UploadDocumentModalProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'document',
    source: 'Uploaded',
    file_type: 'pdf',
    category: '',
    tags: [] as string[],
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tagInput, setTagInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setIsUploading(true)
    try {
      await knowledgeApi.upload({
        ...formData,
        tags: formData.tags,
      }, selectedFile || undefined)
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        document_type: 'document',
        source: 'Uploaded',
        file_type: 'pdf',
        category: '',
        tags: [],
      })
      setSelectedFile(null)
      setTagInput('')
      onSuccess()
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Không thể upload tài liệu. Vui lòng thử lại.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-detect file type
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
      setFormData({ ...formData, file_type: ext })
      
      // Auto-fill title if empty
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setFormData({ ...formData, title: nameWithoutExt, file_type: ext })
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload tài liệu mới" size="lg">
      <form onSubmit={handleSubmit}>
        <FormField label="Tên tài liệu *">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Nhập tên tài liệu..."
            required
          />
        </FormField>

        <FormField label="Mô tả">
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Mô tả ngắn về tài liệu..."
            rows={3}
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <FormField label="Loại tài liệu">
            <select
              value={formData.document_type}
              onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
            >
              <option value="document">Tài liệu</option>
              <option value="regulation">Quy định</option>
              <option value="policy">Chính sách</option>
              <option value="technical">Kỹ thuật</option>
              <option value="template">Template</option>
              <option value="meeting_minutes">Biên bản</option>
            </select>
          </FormField>

          <FormField label="Nguồn">
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            >
              <option value="Uploaded">Đã upload</option>
              <option value="SharePoint">SharePoint</option>
              <option value="Wiki">Wiki</option>
              <option value="LOffice">LOffice</option>
              <option value="NHNN">NHNN</option>
            </select>
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <FormField label="File">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.pptx,.txt,.md"
            />
            {selectedFile && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </FormField>

          <FormField label="Danh mục">
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Compliance, Technical, etc."
            />
          </FormField>
        </div>

        <FormField label="Tags">
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
            {formData.tags.map((tag, idx) => (
              <span
                key={idx}
                className="badge badge--neutral"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Nhập tag và nhấn Enter..."
              style={{ flex: 1 }}
            />
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleAddTag}>
              <Plus size={14} />
            </button>
          </div>
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn btn--primary" disabled={!formData.title.trim() || isUploading}>
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default KnowledgeHub
