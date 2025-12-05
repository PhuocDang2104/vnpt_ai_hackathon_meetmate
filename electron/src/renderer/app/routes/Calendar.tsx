import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  MapPin,
} from 'lucide-react'
import { meetings, formatTime, getMeetingTypeLabel } from '../../store/mockData'

const Calendar = () => {
  const today = new Date()
  const currentMonth = today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
  
  // Get days in current month
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const todayMeetings = meetings.filter(m => {
    const meetingDate = m.startTime.toDateString()
    return meetingDate === today.toDateString()
  })

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
  <div>
          <h1 className="page-header__title">Lịch họp</h1>
          <p className="page-header__subtitle">Quản lý lịch họp của bạn</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary">
            <Plus size={16} />
            Tạo cuộc họp
          </button>
        </div>
      </div>

      <div className="grid grid--2" style={{ gridTemplateColumns: '1fr 360px' }}>
        {/* Calendar Grid */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">
              <CalendarIcon size={18} className="card__title-icon" />
              {currentMonth}
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              <button className="btn btn--ghost btn--icon">
                <ChevronLeft size={18} />
              </button>
              <button className="btn btn--secondary btn--sm">Hôm nay</button>
              <button className="btn btn--ghost btn--icon">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="card__body">
            {/* Week days header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '2px',
              marginBottom: 'var(--space-sm)'
            }}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} style={{ 
                  textAlign: 'center', 
                  padding: 'var(--space-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)'
                }}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '2px'
            }}>
              {emptyDays.map(i => (
                <div key={`empty-${i}`} style={{ padding: 'var(--space-md)' }}></div>
              ))}
              {days.map(day => {
                const isToday = day === today.getDate()
                const hasMeetings = meetings.some(m => {
                  const meetingDay = m.startTime.getDate()
                  const meetingMonth = m.startTime.getMonth()
                  return meetingDay === day && meetingMonth === today.getMonth()
                })
                
                return (
                  <div 
                    key={day} 
                    style={{ 
                      textAlign: 'center', 
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-sm)',
                      background: isToday ? 'var(--accent)' : 'transparent',
                      color: isToday ? 'var(--bg-base)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      position: 'relative',
                      fontWeight: isToday ? 600 : 400,
                    }}
                  >
                    {day}
                    {hasMeetings && !isToday && (
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '4px',
                        height: '4px',
                        background: 'var(--accent)',
                        borderRadius: '50%'
                      }}></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">
              <Clock size={18} className="card__title-icon" />
              Hôm nay
            </h3>
            <span className="badge badge--info">{todayMeetings.length} cuộc họp</span>
          </div>
          <div className="card__body">
            {todayMeetings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {todayMeetings.map(meeting => (
                  <Link 
                    key={meeting.id}
                    to={`/meetings/${meeting.id}/${meeting.phase}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{
                      padding: 'var(--space-md)',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `3px solid var(--${meeting.phase === 'in' ? 'error' : meeting.phase === 'pre' ? 'info' : 'success'})`,
                      cursor: 'pointer',
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-sm)'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
                          {formatTime(meeting.startTime)}
                        </span>
                        <span className={`meeting-item__phase meeting-item__phase--${meeting.phase}`}>
                          {meeting.phase === 'in' ? 'Live' : meeting.phase === 'pre' ? 'Chuẩn bị' : 'Xong'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: 'var(--space-xs)' }}>
                        {meeting.title}
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={12} />
                          {meeting.participants.length}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} />
                          {meeting.location}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <CalendarIcon size={48} className="empty-state__icon" />
                <div className="empty-state__title">Không có cuộc họp</div>
                <div className="empty-state__description">
                  Hôm nay bạn không có cuộc họp nào được lên lịch
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  </div>
)
}

export default Calendar
