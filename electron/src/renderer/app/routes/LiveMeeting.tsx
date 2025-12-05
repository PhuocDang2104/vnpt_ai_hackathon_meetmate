import { Link } from 'react-router-dom'
import { Radio, Users, Clock, ArrowRight } from 'lucide-react'
import { meetings, formatTime } from '../../store/mockData'

const LiveMeeting = () => {
  const liveMeeting = meetings.find(m => m.phase === 'in')

  if (!liveMeeting) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Live Meeting</h1>
            <p className="page-header__subtitle">Không có cuộc họp nào đang diễn ra</p>
          </div>
        </div>

        <div className="card">
          <div className="card__body">
            <div className="empty-state">
              <Radio size={48} className="empty-state__icon" />
              <div className="empty-state__title">Không có cuộc họp live</div>
              <div className="empty-state__description">
                Hiện tại không có cuộc họp nào đang diễn ra. Khi bạn bắt đầu một cuộc họp, nó sẽ xuất hiện ở đây.
              </div>
              <Link to="/meetings" className="btn btn--primary" style={{ marginTop: 'var(--space-lg)' }}>
                Xem danh sách cuộc họp
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Live Meeting</h1>
          <p className="page-header__subtitle">Cuộc họp đang diễn ra</p>
        </div>
      </div>

      <Link to={`/meetings/${liveMeeting.id}/in`} style={{ textDecoration: 'none' }}>
        <div className="card card--interactive" style={{ borderColor: 'var(--error)', borderLeftWidth: '3px' }}>
          <div className="card__body" style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                  <span className="live-indicator">
                    <span className="live-indicator__dot"></span>
                    LIVE
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Bắt đầu lúc {formatTime(liveMeeting.startTime)}
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                  {liveMeeting.title}
                </h2>
                <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                    <Users size={14} />
                    {liveMeeting.participants.length} người tham gia
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                    <Clock size={14} />
                    Đang diễn ra
                  </span>
                </div>
              </div>
              <button className="btn btn--primary" style={{ fontSize: '15px', padding: 'var(--space-md) var(--space-xl)' }}>
                Tham gia ngay
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default LiveMeeting
