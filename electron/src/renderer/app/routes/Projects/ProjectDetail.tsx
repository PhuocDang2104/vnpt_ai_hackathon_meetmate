import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getStoredUser } from '../../../lib/api/auth'
import { adminListProjects } from '../../../lib/api/admin'
import { Project } from '../../../shared/dto/project'
import { Document } from '../../../shared/dto/document'
import { Meeting } from '../../../shared/dto/meeting'
import { ProjectMember } from '../../../shared/dto/projectMember'
import { useLanguage } from '../../../contexts/LanguageContext'
import projectsApi from '../../../lib/api/projects'
import { FolderOpen, Users, FileText, MessageSquare, Calendar } from 'lucide-react'

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { t } = useLanguage()
  const user = getStoredUser()
  const isAdmin = (user?.role || '').toLowerCase() === 'admin'

  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [docs, setDocs] = useState<Document[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!projectId) return
      setLoading(true)
      try {
        // project detail
        const proj = await projectsApi.get(projectId)
        setProject(proj)
        // members
        const m = await projectsApi.listMembers(projectId)
        setMembers(m.members || [])
        // documents
        const d = await projectsApi.listDocuments(projectId)
        setDocs(d.documents || [])
        // meetings
        const mt = await projectsApi.listMeetings(projectId)
        setMeetings(mt.meetings || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-header__title">Dự án</h1>
          <p>Bạn cần quyền admin để xem chi tiết dự án.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page">
        <div className="form-loading" style={{ padding: 'var(--space-2xl)' }}>
          <div className="spinner" style={{ width: 32, height: 32 }}></div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="page">
        <div className="empty-state">
          <FolderOpen className="empty-state__icon" />
          <h3 className="empty-state__title">Không tìm thấy dự án</h3>
          <p className="empty-state__description">Kiểm tra lại liên kết hoặc danh sách dự án.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-header__eyebrow">Project</p>
          <h1 className="page-header__title">{project.name}</h1>
          <p className="page-header__subtitle">{project.description || 'Chưa có mô tả'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 'var(--space-lg)' }}>
        <div className="card" style={{ height: '100%' }}>
          <div className="card__header">
            <h3 className="card__title">Thành viên</h3>
            <p className="card__subtitle">{members.length} người</p>
          </div>
          {members.length === 0 ? (
            <div className="empty-state">
              <Users className="empty-state__icon" />
              <h3 className="empty-state__title">Chưa có thành viên</h3>
              <p className="empty-state__description">Thêm thành viên từ trang admin nếu cần.</p>
            </div>
          ) : (
            <div className="admin-table">
              <div className="admin-table__head" style={{ gridTemplateColumns: '1.4fr 1fr 0.8fr' }}>
                <span>Tên</span><span>Email</span><span>Role</span>
              </div>
              {members.map(m => (
                <div key={m.user_id} className="admin-table__row" style={{ gridTemplateColumns: '1.4fr 1fr 0.8fr' }}>
                  <span>{m.display_name || m.user_id}</span>
                  <span>{m.email || '--'}</span>
                  <span>{m.role || '--'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ height: '100%' }}>
          <div className="card__header">
            <h3 className="card__title">Chat AI về dự án</h3>
            <p className="card__subtitle">Đặt câu hỏi liên quan tài liệu và cuộc họp của dự án.</p>
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea
              className="input input--lg"
              placeholder="Hỏi AI về dự án..."
              value={chatQuestion}
              onChange={e => setChatQuestion(e.target.value)}
              rows={3}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8 }}>
              <button
                className="btn btn--primary"
                onClick={async () => {
                  if (!chatQuestion.trim()) return
                  setChatLoading(true)
                  try {
                    setChatAnswer(`(Placeholder) AI trả lời về dự án: ${chatQuestion}`)
                  } finally {
                    setChatLoading(false)
                  }
                }}
                disabled={chatLoading}
              >
                {chatLoading ? 'Đang hỏi...' : 'Hỏi AI'}
              </button>
            </div>
            {chatAnswer && (
              <div className="card" style={{ background: 'var(--surface-muted)', padding: 12 }}>
                <strong>Trả lời</strong>
                <p style={{ marginTop: 6 }}>{chatAnswer}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Tài liệu</h3>
            <p className="card__subtitle">{docs.length} tài liệu</p>
          </div>
          {docs.length === 0 ? (
            <div className="empty-state">
              <FileText className="empty-state__icon" />
              <h3 className="empty-state__title">Chưa có tài liệu</h3>
            </div>
          ) : (
            <div className="admin-table">
              <div className="admin-table__head" style={{ gridTemplateColumns: '1.5fr 0.8fr 1fr 0.8fr' }}>
                <span>Tiêu đề</span><span>Loại</span><span>File</span><span>Ngày</span>
              </div>
              {docs.map(d => (
                <div key={String(d.id)} className="admin-table__row" style={{ gridTemplateColumns: '1.5fr 0.8fr 1fr 0.8fr' }}>
                  <span>{d.title || d.name}</span>
                  <span>{d.file_type || '--'}</span>
                  <span>{d.file_url ? <a href={d.file_url} target="_blank" rel="noreferrer">Xem</a> : '--'}</span>
                  <span>{d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString() : '--'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Cuộc họp</h3>
            <p className="card__subtitle">{meetings.length} cuộc họp</p>
          </div>
          {meetings.length === 0 ? (
            <div className="empty-state">
              <Calendar className="empty-state__icon" />
              <h3 className="empty-state__title">Chưa có cuộc họp</h3>
            </div>
          ) : (
            <div className="meeting-list">
              {meetings.map(m => (
                <div key={m.id} className="meeting-item">
                  <div className="meeting-item__time">
                    <div className="meeting-item__time-value">
                      {m.start_time ? new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                    <div className="meeting-item__time-period">
                      {m.start_time ? new Date(m.start_time).toLocaleDateString() : 'TBD'}
                    </div>
                  </div>
                  <div className="meeting-item__divider"></div>
                  <div className="meeting-item__content">
                    <div className="meeting-item__title">{m.title}</div>
                    <div className="meeting-item__meta">
                      <span className="meeting-item__meta-item">
                        {m.meeting_type || '--'}
                      </span>
                      {m.location && (
                        <span className="meeting-item__meta-item">
                          {m.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`meeting-item__phase meeting-item__phase--${m.phase || 'pre'}`}>
                    {m.phase}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
