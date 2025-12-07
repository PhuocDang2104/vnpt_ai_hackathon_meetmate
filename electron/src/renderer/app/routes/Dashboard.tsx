/**
 * Dashboard - Overview page with real-time data
 * Uses MeetingService for unified data fetching
 */
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
  Loader2,
  RefreshCw,
} from 'lucide-react'
import {
  actionItems,
  formatTime,
  isOverdue,
} from '../../store/mockData'
import {
  useUpcomingMeetings,
  useDashboardStats,
  useLiveMeeting,
  type NormalizedMeeting,
} from '../../services/meeting'

// Skeleton Loader Component
const SkeletonCard = () => (
  <div className="card stats-card">
    <div className="stats-card__icon" style={{ background: 'var(--bg-surface)', opacity: 0.5 }}>
      <div style={{ width: 22, height: 22, background: 'var(--bg-surface-hover)', borderRadius: 4 }} />
    </div>
    <div className="stats-card__content">
      <div style={{ width: 80, height: 12, background: 'var(--bg-surface-hover)', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ width: 40, height: 24, background: 'var(--bg-surface-hover)', borderRadius: 4 }} />
    </div>
  </div>
)

const SkeletonMeetingItem = () => (
  <div className="meeting-item" style={{ opacity: 0.5 }}>
    <div className="meeting-item__time">
      <div style={{ width: 40, height: 16, background: 'var(--bg-surface-hover)', borderRadius: 4 }} />
    </div>
    <div className="meeting-item__divider"></div>
    <div className="meeting-item__content">
      <div style={{ width: '80%', height: 14, background: 'var(--bg-surface-hover)', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ width: '50%', height: 12, background: 'var(--bg-surface-hover)', borderRadius: 4 }} />
    </div>
  </div>
)

const Dashboard = () => {
  // Use service hooks for data fetching
  const { data: upcomingMeetings, isLoading: loadingMeetings, error: meetingsError, refetch: refetchMeetings } = useUpcomingMeetings(4)
  const { data: stats, isLoading: loadingStats, error: statsError, refetch: refetchStats } = useDashboardStats()
  const { data: liveMeeting, isLoading: loadingLive } = useLiveMeeting()

  // Action items from mock data (backend not ready)
  const pendingActions = actionItems
    .filter(a => a.status !== 'completed' && a.status !== 'cancelled')
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, 5)

  // Handle refresh
  const handleRefresh = () => {
    refetchMeetings()
    refetchStats()
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__subtitle">Xin chào! Đây là tổng quan hôm nay.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--ghost" onClick={handleRefresh} title="Làm mới">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn--secondary">
            <Download size={16} />
            Export Report
          </button>
          <Link to="/app/meetings" className="btn btn--primary">
            <Plus size={16} />
            Tạo cuộc họp
          </Link>
        </div>
      </div>

      {/* Error Toast */}
      {(meetingsError || statsError) && (
        <div className="card mb-4" style={{ borderColor: 'var(--error)', borderLeftWidth: 3 }}>
          <div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--error)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Không thể tải dữ liệu</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {meetingsError || statsError}. Đang sử dụng dữ liệu mẫu.
              </div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={handleRefresh} style={{ marginLeft: 'auto' }}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Live Meeting Alert */}
      {!loadingLive && liveMeeting && (
        <Link to={`/app/meetings/${liveMeeting.id}/detail`} style={{ textDecoration: 'none' }}>
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
                    {liveMeeting.participants} người tham gia
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
        {loadingStats ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="card stats-card">
              <div className="stats-card__icon stats-card__icon--info">
                <Calendar size={22} />
              </div>
              <div className="stats-card__content">
                <div className="stats-card__label">Cuộc họp hôm nay</div>
                <div className="stats-card__value">{stats?.todayMeetings ?? 0}</div>
                <div className="stats-card__trend stats-card__trend--up">
                  <Check size={12} />
                  {stats?.completed ?? 0} hoàn thành
                </div>
              </div>
            </div>

            <div className="card stats-card">
              <div className="stats-card__icon stats-card__icon--success">
                <CheckSquare size={22} />
              </div>
              <div className="stats-card__content">
                <div className="stats-card__label">Action Items</div>
                <div className="stats-card__value">{stats?.totalActions ?? 0}</div>
                <div className="stats-card__trend stats-card__trend--down">
                  <TrendingDown size={12} />
                  {stats?.actionsOverdue ?? 0} quá hạn
                </div>
              </div>
            </div>

            <div className="card stats-card">
              <div className="stats-card__icon stats-card__icon--accent">
                <FileText size={22} />
              </div>
              <div className="stats-card__content">
                <div className="stats-card__label">Quyết định</div>
                <div className="stats-card__value">{stats?.totalDecisions ?? 0}</div>
                <div className="stats-card__trend stats-card__trend--up">
                  <TrendingUp size={12} />
                  {stats?.decisionsConfirmed ?? 0} đã xác nhận
                </div>
              </div>
            </div>

            <div className="card stats-card">
              <div className="stats-card__icon stats-card__icon--warning">
                <AlertTriangle size={22} />
              </div>
              <div className="stats-card__content">
                <div className="stats-card__label">Rủi ro</div>
                <div className="stats-card__value">{stats?.totalRisks ?? 0}</div>
                <div className="stats-card__trend">
                  {stats?.risksHigh ?? 0} cao/khẩn cấp
                </div>
              </div>
            </div>
          </>
        )}
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
            <Link to="/app/meetings" className="btn btn--ghost btn--sm">
              Xem tất cả
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card__body">
            {loadingMeetings ? (
              <div className="meeting-list">
                <SkeletonMeetingItem />
                <SkeletonMeetingItem />
                <SkeletonMeetingItem />
              </div>
            ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
              <div className="meeting-list">
                {upcomingMeetings.map((meeting: NormalizedMeeting) => (
                  <Link 
                    key={meeting.id} 
                    to={`/app/meetings/${meeting.id}/detail`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="meeting-item">
                      <div className="meeting-item__time">
                        <div className="meeting-item__time-value">
                          {meeting.start}
                        </div>
                        <div className="meeting-item__time-period">
                          {meeting.status === 'in_progress' ? 'Đang họp' : 'Sắp tới'}
                        </div>
                      </div>
                      <div className="meeting-item__divider"></div>
                      <div className="meeting-item__content">
                        <div className="meeting-item__title">{meeting.title}</div>
                        <div className="meeting-item__meta">
                          <span className="meeting-item__meta-item">
                            <Users size={12} />
                            {meeting.participants}
                          </span>
                          {meeting.location && (
                            <span className="meeting-item__meta-item">
                              <MapPin size={12} />
                              {meeting.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`meeting-item__phase meeting-item__phase--${meeting.phase}`}>
                        {meeting.status === 'in_progress' ? 'Live' : meeting.phase === 'pre' ? 'Chuẩn bị' : 'Xong'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Calendar size={48} className="empty-state__icon" />
                <div className="empty-state__title">Không có cuộc họp</div>
                <div className="empty-state__description">
                  Bạn không có cuộc họp nào sắp tới
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">
              <CheckSquare size={18} className="card__title-icon" />
              Action Items cần xử lý
            </h3>
            <Link to="/app/tasks" className="btn btn--ghost btn--sm">
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
                {stats?.actionsOverdue ?? 1} action item đang quá hạn. Cần escalate với Tech Lead để đẩy nhanh tiến độ.
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
