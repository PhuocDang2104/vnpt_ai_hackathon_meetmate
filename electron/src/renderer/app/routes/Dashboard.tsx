import { Link } from 'react-router-dom'
import {
  Calendar,
  CheckSquare,
  FileText,
  AlertTriangle,
  Users,
  MapPin,
  ArrowRight,
  Mic,
  Clock,
  User,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  BarChart3,
  Download,
  Plus,
  Check,
} from 'lucide-react'
import {
  meetings,
  actionItems,
  dashboardStats,
  formatTime,
  isOverdue,
} from '../../store/mockData'

const Dashboard = () => {
  const upcomingMeetings = meetings
    .filter(m => m.phase !== 'post')
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 4)

  const pendingActions = actionItems
    .filter(a => a.status !== 'completed' && a.status !== 'cancelled')
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, 5)

  const liveMeeting = meetings.find(m => m.phase === 'in')

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__subtitle">Xin chào, Nguyễn Văn A! Đây là tổng quan hôm nay.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--secondary">
            <Download size={16} />
            Export Report
          </button>
          <button className="btn btn--primary">
            <Plus size={16} />
            Tạo cuộc họp
          </button>
        </div>
      </div>

      {/* Live Meeting Alert */}
      {liveMeeting && (
        <Link to={`/meetings/${liveMeeting.id}/in`} style={{ textDecoration: 'none' }}>
          <div className="card card--interactive mb-6" style={{ 
            borderColor: 'var(--error)',
            borderLeftWidth: '3px'
          }}>
            <div className="card__body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-base)' }}>
                <div className="live-indicator">
                  <span className="live-indicator__dot"></span>
                  LIVE
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{liveMeeting.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: '4px' }}>
                    <Users size={14} />
                    {liveMeeting.participants.length} người tham gia
                  </div>
                </div>
              </div>
              <button className="btn btn--primary">
                <Mic size={16} />
                Tham gia ngay
              </button>
            </div>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid--4 mb-6">
        <div className="card stats-card">
          <div className="stats-card__icon stats-card__icon--info">
            <Calendar size={22} />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__label">Cuộc họp hôm nay</div>
            <div className="stats-card__value">{dashboardStats.totalMeetingsToday}</div>
            <div className="stats-card__trend stats-card__trend--up">
              <Check size={12} />
              {dashboardStats.meetingsCompleted} hoàn thành
            </div>
          </div>
        </div>

        <div className="card stats-card">
          <div className="stats-card__icon stats-card__icon--success">
            <CheckSquare size={22} />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__label">Action Items</div>
            <div className="stats-card__value">{dashboardStats.totalActions}</div>
            <div className="stats-card__trend stats-card__trend--down">
              <TrendingDown size={12} />
              {dashboardStats.actionsOverdue} quá hạn
            </div>
          </div>
        </div>

        <div className="card stats-card">
          <div className="stats-card__icon stats-card__icon--accent">
            <FileText size={22} />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__label">Quyết định</div>
            <div className="stats-card__value">{dashboardStats.totalDecisions}</div>
            <div className="stats-card__trend stats-card__trend--up">
              <TrendingUp size={12} />
              {dashboardStats.decisionsConfirmed} đã xác nhận
            </div>
          </div>
        </div>

        <div className="card stats-card">
          <div className="stats-card__icon stats-card__icon--warning">
            <AlertTriangle size={22} />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__label">Rủi ro</div>
            <div className="stats-card__value">{dashboardStats.totalRisks}</div>
            <div className="stats-card__trend">
              {dashboardStats.risksHigh} cao/khẩn cấp
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid--2">
        {/* Upcoming Meetings */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">
              <Calendar size={18} className="card__title-icon" />
              Cuộc họp sắp tới
            </h3>
            <Link to="/meetings" className="btn btn--ghost btn--sm">
              Xem tất cả
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card__body">
            <div className="meeting-list">
              {upcomingMeetings.map(meeting => (
                <Link 
                  key={meeting.id} 
                  to={`/meetings/${meeting.id}/${meeting.phase}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="meeting-item">
                    <div className="meeting-item__time">
                      <div className="meeting-item__time-value">
                        {formatTime(meeting.startTime)}
                      </div>
                      <div className="meeting-item__time-period">
                        {meeting.phase === 'in' ? 'Đang họp' : 'Sắp tới'}
                      </div>
                    </div>
                    <div className="meeting-item__divider"></div>
                    <div className="meeting-item__content">
                      <div className="meeting-item__title">{meeting.title}</div>
                      <div className="meeting-item__meta">
                        <span className="meeting-item__meta-item">
                          <Users size={12} />
                          {meeting.participants.length}
                        </span>
                        <span className="meeting-item__meta-item">
                          <MapPin size={12} />
                          {meeting.location}
                        </span>
                      </div>
                    </div>
                    <span className={`meeting-item__phase meeting-item__phase--${meeting.phase}`}>
                      {meeting.phase === 'in' ? 'Live' : meeting.phase === 'pre' ? 'Chuẩn bị' : 'Xong'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">
              <CheckSquare size={18} className="card__title-icon" />
              Action Items cần xử lý
            </h3>
            <Link to="/tasks" className="btn btn--ghost btn--sm">
              Xem tất cả
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card__body">
            <div className="action-list">
              {pendingActions.map(action => (
                <div key={action.id} className="action-item">
                  <div className={`action-item__checkbox ${action.status === 'completed' ? 'action-item__checkbox--checked' : ''}`}>
                    {action.status === 'completed' && <Check size={12} />}
                  </div>
                  <div className="action-item__content">
                    <div className={`action-item__title ${action.status === 'completed' ? 'action-item__title--completed' : ''}`}>
                      {action.description}
                    </div>
                    <div className="action-item__meta">
                      <span className={`action-item__priority action-item__priority--${action.priority}`}>
                        {action.priority}
                      </span>
                      <span className="action-item__meta-item">
                        <User size={12} />
                        {action.owner.displayName.split(' ').slice(-1)[0]}
                      </span>
                      <span className={`action-item__meta-item ${isOverdue(action.deadline) ? 'action-item__deadline--overdue' : ''}`}>
                        <Clock size={12} />
                        {isOverdue(action.deadline) ? 'Quá hạn' : action.deadline.toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card mt-6">
        <div className="card__header">
          <h3 className="card__title">
            <Lightbulb size={18} className="card__title-icon" />
            AI Insights
          </h3>
        </div>
        <div className="card__body">
          <div className="grid grid--3">
            <div className="insight-box insight-box--info">
              <div className="insight-box__title">
                <BarChart3 size={16} />
                Phân tích tiến độ
              </div>
              <div className="insight-box__content">
                Dự án Core Banking đạt 68% tiến độ. Có thể hoàn thành đúng hạn nếu bổ sung resources như đã phê duyệt.
              </div>
            </div>
            <div className="insight-box insight-box--warning">
              <div className="insight-box__title">
                <AlertTriangle size={16} />
                Cảnh báo
              </div>
              <div className="insight-box__content">
                1 action item đang quá hạn 3 ngày. Cần escalate với Tech Lead để đẩy nhanh tiến độ.
              </div>
            </div>
            <div className="insight-box insight-box--success">
              <div className="insight-box__title">
                <Lightbulb size={16} />
                Đề xuất
              </div>
              <div className="insight-box__content">
                Nên mời Security Architect vào cuộc họp Risk Review sắp tới để review API security design.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
