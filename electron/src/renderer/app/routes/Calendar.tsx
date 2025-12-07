/**
 * Calendar - Meeting schedule view
 * Uses MeetingService for unified data fetching
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  MapPin,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import {
  useCalendarMeetings,
  useTodayMeetings,
  type NormalizedMeeting,
} from '../../services/meeting'

// Skeleton Loader
const SkeletonMeetingCard = () => (
  <div style={{
    padding: 'var(--space-md)',
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-sm)',
    opacity: 0.5,
  }}>
    <div style={{ width: '50%', height: 12, background: 'var(--bg-surface-hover)', borderRadius: 4, marginBottom: 8 }} />
    <div style={{ width: '80%', height: 14, background: 'var(--bg-surface-hover)', borderRadius: 4, marginBottom: 8 }} />
    <div style={{ width: '60%', height: 10, background: 'var(--bg-surface-hover)', borderRadius: 4 }} />
  </div>
)

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Calculate month boundaries for calendar view
  const { startOfMonth, endOfMonth, monthLabel, daysInMonth, firstDayOfWeek } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59)
    
    return {
      startOfMonth: start,
      endOfMonth: end,
      monthLabel: currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
      daysInMonth: end.getDate(),
      firstDayOfWeek: start.getDay(),
    }
  }, [currentDate])

  // Use service hooks for data fetching
  const { 
    data: monthMeetings, 
    isLoading: loadingMonth, 
    error: monthError,
    refetch: refetchMonth 
  } = useCalendarMeetings(startOfMonth, endOfMonth)
  
  const { 
    data: todayMeetings, 
    isLoading: loadingToday,
    error: todayError,
    refetch: refetchToday 
  } = useTodayMeetings()

  const today = new Date()
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleRefresh = () => {
    refetchMonth()
    refetchToday()
  }

  // Check if a day has meetings
  const getMeetingsForDay = (day: number): NormalizedMeeting[] => {
    if (!monthMeetings) return []
    return monthMeetings.filter(m => {
      const meetingDate = m.startTime
      return meetingDate.getDate() === day && 
             meetingDate.getMonth() === currentDate.getMonth() &&
             meetingDate.getFullYear() === currentDate.getFullYear()
    })
  }

  // Generate calendar days
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  const hasError = monthError || todayError

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Lịch họp</h1>
          <p className="page-header__subtitle">Quản lý lịch họp của bạn</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--ghost" onClick={handleRefresh} title="Làm mới">
            <RefreshCw size={16} />
          </button>
          <Link to="/app/meetings" className="btn btn--primary">
            <Plus size={16} />
            Tạo cuộc họp
          </Link>
        </div>
      </div>

      {/* Error Toast */}
      {hasError && (
        <div className="card mb-4" style={{ borderColor: 'var(--error)', borderLeftWidth: 3 }}>
          <div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Không thể tải dữ liệu</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Đang sử dụng dữ liệu mẫu.
              </div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={handleRefresh} style={{ marginLeft: 'auto' }}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      <div className="grid grid--2" style={{ gridTemplateColumns: '1fr 360px' }}>
        {/* Calendar Grid */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">
              <CalendarIcon size={18} className="card__title-icon" />
              {monthLabel}
              {loadingMonth && <Loader2 size={14} className="animate-spin" style={{ marginLeft: 8 }} />}
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              <button className="btn btn--ghost btn--icon" onClick={goToPreviousMonth}>
                <ChevronLeft size={18} />
              </button>
              <button 
                className={`btn btn--sm ${isCurrentMonth ? 'btn--secondary' : 'btn--ghost'}`}
                onClick={goToToday}
              >
                Hôm nay
              </button>
              <button className="btn btn--ghost btn--icon" onClick={goToNextMonth}>
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
                const isToday = isCurrentMonth && day === today.getDate()
                const dayMeetings = getMeetingsForDay(day)
                const hasMeetings = dayMeetings.length > 0
                const hasLive = dayMeetings.some(m => m.status === 'in_progress')
                
                return (
                  <div 
                    key={day} 
                    style={{ 
                      textAlign: 'center', 
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-sm)',
                      background: isToday ? 'var(--accent)' : hasMeetings ? 'var(--bg-surface)' : 'transparent',
                      color: isToday ? 'var(--bg-base)' : 'var(--text-primary)',
                      cursor: hasMeetings ? 'pointer' : 'default',
                      position: 'relative',
                      fontWeight: isToday ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                    title={hasMeetings ? `${dayMeetings.length} cuộc họp` : ''}
                  >
                    {day}
                    {hasMeetings && !isToday && (
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '2px',
                      }}>
                        {dayMeetings.slice(0, 3).map((_, idx) => (
                          <div 
                            key={idx}
                            style={{
                              width: '4px',
                              height: '4px',
                              background: hasLive ? 'var(--error)' : 'var(--accent)',
                              borderRadius: '50%'
                            }}
                          />
                        ))}
                      </div>
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
              {loadingToday && <Loader2 size={14} className="animate-spin" style={{ marginLeft: 8 }} />}
            </h3>
            <span className="badge badge--info">{todayMeetings?.length ?? 0} cuộc họp</span>
          </div>
          <div className="card__body">
            {loadingToday ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <SkeletonMeetingCard />
                <SkeletonMeetingCard />
              </div>
            ) : todayMeetings && todayMeetings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {todayMeetings.map((meeting: NormalizedMeeting) => (
                  <Link 
                    key={meeting.id}
                    to={`/app/meetings/${meeting.id}/detail`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{
                      padding: 'var(--space-md)',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `3px solid var(--${meeting.status === 'in_progress' ? 'error' : meeting.phase === 'pre' ? 'info' : 'success'})`,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-sm)'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
                          {meeting.start}
                        </span>
                        <span className={`meeting-item__phase meeting-item__phase--${meeting.phase}`}>
                          {meeting.status === 'in_progress' ? 'Live' : meeting.phase === 'pre' ? 'Chuẩn bị' : 'Xong'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: 'var(--space-xs)' }}>
                        {meeting.title}
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={12} />
                          {meeting.participants}
                        </span>
                        {meeting.location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />
                            {meeting.location}
                          </span>
                        )}
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
