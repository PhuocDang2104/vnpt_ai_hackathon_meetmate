import { useState } from 'react'
import {
  Search,
  BookOpen,
  FileText,
  Bot,
  Send,
  ExternalLink,
  Clock,
  FolderOpen,
} from 'lucide-react'

const KnowledgeHub = () => {
  const [query, setQuery] = useState('')

  const recentQueries = [
    { query: 'Data retention policy theo NHNN', timestamp: '10 phút trước' },
    { query: 'CR-2024-015 API Gateway status', timestamp: '1 giờ trước' },
    { query: 'KYC requirements for remote onboarding', timestamp: '2 giờ trước' },
  ]

  const suggestedDocs = [
    { title: 'Thông tư 09/2020/TT-NHNN', source: 'Wiki', type: 'Regulation' },
    { title: 'Core Banking Integration Guide', source: 'SharePoint', type: 'Technical' },
    { title: 'KYC Policy 2024', source: 'LOffice', type: 'Policy' },
    { title: 'Risk Assessment Template', source: 'SharePoint', type: 'Template' },
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Knowledge Hub</h1>
          <p className="page-header__subtitle">Tìm kiếm tài liệu và hỏi đáp với AI</p>
        </div>
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
            <button className="btn btn--primary">
              <Send size={16} />
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
                onClick={() => setQuery(suggestion)}
                style={{ fontSize: '12px' }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid--2">
        {/* AI Chat */}
        <div className="ai-chat" style={{ height: '500px' }}>
          <div className="ai-chat__header">
            <div className="ai-chat__avatar">
              <Bot size={20} />
            </div>
            <div>
              <div className="ai-chat__title">MeetMate AI</div>
              <div className="ai-chat__subtitle">Knowledge Assistant</div>
            </div>
          </div>
          <div className="ai-chat__messages">
            <div className="ai-chat__message ai-chat__message--ai">
              Xin chào! Tôi có thể giúp bạn tìm kiếm thông tin từ:
              <br /><br />
              • Tài liệu trên SharePoint, LOffice, Wiki<br />
              • Nội dung các cuộc họp trước<br />
              • Policies và regulations<br />
              • Change Requests và decisions<br /><br />
              Hãy đặt câu hỏi của bạn!
            </div>
          </div>
          <div className="ai-chat__input">
            <input 
              type="text" 
              className="ai-chat__input-field" 
              placeholder="Nhập câu hỏi của bạn..."
            />
            <button className="btn btn--primary btn--icon">
              <Send size={16} />
            </button>
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
                {recentQueries.map((item, index) => (
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
                    onClick={() => setQuery(item.query)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <Search size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '13px' }}>{item.query}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggested Documents */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">
                <BookOpen size={18} className="card__title-icon" />
                Tài liệu phổ biến
              </h3>
            </div>
            <div className="card__body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {suggestedDocs.map((doc, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      padding: 'var(--space-md)',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
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
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <FolderOpen size={12} />
                        {doc.source}
                        <span>•</span>
                        {doc.type}
                      </div>
                    </div>
                    <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KnowledgeHub
