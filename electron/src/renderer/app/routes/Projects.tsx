import { useEffect, useState } from 'react'
import { PlusCircle, RefreshCw, X, FolderOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminListProjects, adminCreateProject } from '../../lib/api/admin'
import { Project } from '../../shared/dto/project'
import { getStoredUser } from '../../lib/api/auth'
import { useLanguage } from '../../contexts/LanguageContext'

const Projects = () => {
  const { t } = useLanguage()
  const user = getStoredUser()
  const isAdmin = (user?.role || '').toLowerCase() === 'admin'

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<{ name: string; code?: string; description?: string }>({
    name: '',
    code: '',
    description: '',
  })
  const [showModal, setShowModal] = useState(false)

  const loadProjects = async () => {
    setLoading(true)
    try {
      const res = await adminListProjects({ limit: 200 })
      setProjects(res.projects)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      await adminCreateProject({
        name: form.name.trim(),
        code: form.code?.trim() || undefined,
        description: form.description?.trim() || undefined,
      })
      setForm({ name: '', code: '', description: '' })
      await loadProjects()
      setShowModal(false)
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadProjects()
    }
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Projects</p>
            <h1 className="page-header__title">Quản lý dự án</h1>
            <p className="page-header__subtitle">Chỉ admin mới xem được danh sách dự án.</p>
          </div>
        </div>
        <div className="card">
          <p>Bạn cần quyền admin để truy cập trang này.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-header__eyebrow">Projects</p>
          <h1 className="page-header__title">Quản lý dự án</h1>
          <p className="page-header__subtitle">
            Tạo mới, xem danh sách dự án và mô tả ngắn gọn.
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn-outline" onClick={loadProjects} disabled={loading}>
            <RefreshCw size={16} style={{ marginRight: 6 }} /> {loading ? t('common.loading') : 'Tải lại'}
          </button>
          <button className="btn btn--primary" onClick={() => setShowModal(true)}>
            <PlusCircle size={16} style={{ marginRight: 6 }} /> Tạo dự án
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Danh sách dự án</h3>
          <p className="card__subtitle">{projects.length} dự án</p>
        </div>
        {projects.length === 0 ? (
          <div className="empty-state">
            <FolderOpen className="empty-state__icon" />
            <h3 className="empty-state__title">Chưa có dự án nào</h3>
            <p className="empty-state__description">Bấm "Tạo dự án" để thêm dự án mới.</p>
          </div>
        ) : (
          <div className="meeting-list">
            {projects.map(p => (
              <Link key={p.id} to={`/app/projects/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="meeting-item">
                  <div className="meeting-item__content" style={{ width: '100%' }}>
                    <div className="meeting-item__title">{p.name}</div>
                    <div className="meeting-item__meta">
                      <span className="meeting-item__meta-item">
                        Mã: {p.code || '--'}
                      </span>
                      <span className="meeting-item__meta-item">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '--'}
                      </span>
                    </div>
                    {p.description && (
                      <div className="meeting-item__meta" style={{ marginTop: 6 }}>
                        <span className="meeting-item__meta-item">{p.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '40vw', maxWidth: 640, minWidth: 420 }}>
            <div className="modal__header">
              <div>
                <p className="modal__eyebrow">Projects</p>
                <h3 className="modal__title">Tạo dự án mới</h3>
                <p className="modal__subtitle">Nhập tên, mã và mô tả (tuỳ chọn).</p>
              </div>
              <button className="modal__close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
                <label className="form-field">
                  <span className="form-field__label">Tên dự án *</span>
                  <input
                    className="input input--lg"
                    placeholder="VD: LPB - Digital Onboarding"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </label>

                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <label className="form-field">
                    <span className="form-field__label">Mã dự án (tuỳ chọn)</span>
                    <input
                      className="input input--lg"
                      placeholder="VD: PROJ-001"
                      value={form.code}
                      onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">Phạm vi / Stakeholder (tuỳ chọn)</span>
                    <input
                      className="input input--lg"
                      placeholder="VD: PMO, Tech, Biz; Org/Dept liên quan"
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </label>
                </div>

                <label className="form-field">
                  <span className="form-field__label">Mô tả chi tiết (tuỳ chọn)</span>
                  <textarea
                    className="input input--lg"
                    placeholder="Mục tiêu, phạm vi, mốc quan trọng, stakeholder chính..."
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{ width: '100%' }}
                  />
                </label>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowModal(false)} disabled={creating}>
                Hủy
              </button>
              <button className="btn btn--primary" onClick={handleCreate} disabled={creating}>
                {creating ? t('common.loading') : 'Tạo dự án'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Projects
