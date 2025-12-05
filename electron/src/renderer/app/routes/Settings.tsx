import {
  Settings as SettingsIcon,
  User,
  Bell,
  Link2,
  Shield,
  Palette,
  Bot,
  ExternalLink,
  Check,
} from 'lucide-react'
import { currentUser } from '../../store/mockData'

const Settings = () => {
  const integrations = [
    { name: 'Microsoft Teams', status: 'connected', icon: '📞' },
    { name: 'Microsoft Planner', status: 'connected', icon: '📋' },
    { name: 'Jira', status: 'connected', icon: '🎯' },
    { name: 'SharePoint', status: 'connected', icon: '📁' },
    { name: 'LOffice', status: 'pending', icon: '📄' },
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Cài đặt</h1>
          <p className="page-header__subtitle">Quản lý tài khoản và tích hợp</p>
        </div>
      </div>

      <div className="grid grid--2">
        {/* Profile Settings */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">
              <User size={18} className="card__title-icon" />
              Thông tin cá nhân
            </h3>
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'var(--accent)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--bg-base)'
              }}>
                {currentUser.displayName.split(' ').slice(-1)[0][0]}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{currentUser.displayName}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{currentUser.email}</div>
                <span className="badge badge--accent" style={{ marginTop: 'var(--space-xs)' }}>
                  {currentUser.role}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)', display: 'block' }}>
                  Họ và tên
                </label>
                <input 
                  type="text" 
                  defaultValue={currentUser.displayName}
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)', display: 'block' }}>
                  Email
                </label>
                <input 
                  type="email" 
                  defaultValue={currentUser.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)', display: 'block' }}>
                  Phòng ban
                </label>
                <input 
                  type="text" 
                  defaultValue={currentUser.department}
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <button className="btn btn--primary" style={{ marginTop: 'var(--space-lg)' }}>
              Lưu thay đổi
            </button>
          </div>
        </div>

        {/* Integrations */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">
              <Link2 size={18} className="card__title-icon" />
              Tích hợp
            </h3>
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {integrations.map((integration, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-md)',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      background: 'var(--bg-base)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      {integration.icon}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{integration.name}</span>
                  </div>
                  {integration.status === 'connected' ? (
                    <span className="badge badge--success">
                      <Check size={10} />
                      Connected
                    </span>
                  ) : (
                    <button className="btn btn--secondary btn--sm">
                      <ExternalLink size={12} />
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">
              <Bell size={18} className="card__title-icon" />
              Thông báo
            </h3>
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
              {[
                { label: 'Nhắc nhở trước cuộc họp', description: '15 phút trước khi họp' },
                { label: 'Action items mới', description: 'Khi có action item được giao' },
                { label: 'Action items quá hạn', description: 'Cảnh báo khi quá deadline' },
                { label: 'Biên bản họp', description: 'Khi có biên bản mới' },
              ].map((item, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.description}</div>
                  </div>
                  <div style={{
                    width: '40px',
                    height: '22px',
                    background: 'var(--accent)',
                    borderRadius: '11px',
                    position: 'relative',
                    cursor: 'pointer',
                  }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      right: '2px',
                      top: '2px',
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">
              <Bot size={18} className="card__title-icon" />
              Cài đặt AI
            </h3>
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
              {[
                { label: 'Tự động tạo agenda', description: 'AI tạo agenda dựa trên lịch sử họp' },
                { label: 'Gợi ý tài liệu', description: 'RAG tìm tài liệu liên quan' },
                { label: 'Phát hiện action items', description: 'Tự động nhận diện trong transcript' },
                { label: 'Live recap', description: 'Tóm tắt realtime trong cuộc họp' },
              ].map((item, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.description}</div>
                  </div>
                  <div style={{
                    width: '40px',
                    height: '22px',
                    background: 'var(--accent)',
                    borderRadius: '11px',
                    position: 'relative',
                    cursor: 'pointer',
                  }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      background: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      right: '2px',
                      top: '2px',
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  </div>
)
}

export default Settings
