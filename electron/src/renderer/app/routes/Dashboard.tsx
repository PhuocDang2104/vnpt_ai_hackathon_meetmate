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
  const overdueActions = pendingActions.filter(a => isOverdue(a.deadline)).slice(0, 3)

  // Handle refresh
  const handleRefresh = () => {
    refetchMeetings()
    refetchStats()
  }

  // Export Report as CSV
  const handleExportReport = () => {
    const today = new Date().toLocaleDateString('vi-VN')
    
    // Build CSV content
    const csvRows: string[] = []
    
    // Header
    csvRows.push('MeetMate - Báo cáo Dashboard')
    csvRows.push(`Ngày xuất: ${today}`)
    csvRows.push('')
    
    // Stats section
    csvRows.push('=== THỐNG KÊ TỔNG QUAN ===')
    csvRows.push(`Tổng cuộc họp,${stats?.totalMeetings || 0}`)
    csvRows.push(`Cuộc họp hôm nay,${stats?.todayMeetings || 0}`)
    csvRows.push(`Sắp diễn ra,${stats?.upcoming || 0}`)
    csvRows.push(`Đã hoàn thành,${stats?.completed || 0}`)
    csvRows.push(`Action items,${stats?.totalActions || 0}`)
    csvRows.push(`Actions hoàn thành,${stats?.actionsCompleted || 0}`)
    csvRows.push(`Actions quá hạn,${stats?.actionsOverdue || 0}`)
    csvRows.push(`Decisions,${stats?.totalDecisions || 0}`)
    csvRows.push(`Risks cao/nghiêm trọng,${stats?.risksHigh || 0}`)
    csvRows.push('')
    
    // Upcoming meetings
    csvRows.push('=== CUỘC HỌP SẮP TỚI ===')
    csvRows.push('Tiêu đề,Ngày,Giờ bắt đầu,Giờ kết thúc,Địa điểm,Số người tham gia')
    if (upcomingMeetings && upcomingMeetings.length > 0) {
      upcomingMeetings.forEach(m => {
        csvRows.push(`"${m.title}",${m.date},${m.start},${m.end},"${m.location || 'Online'}",${m.participants}`)
      })
    } else {
      csvRows.push('Không có cuộc họp sắp tới')
    }
    csvRows.push('')
    
    // Pending actions
    csvRows.push('=== ACTION ITEMS ĐANG CHỜ ===')
    csvRows.push('Mô tả,Người phụ trách,Deadline,Độ ưu tiên,Trạng thái')
    pendingActions.forEach(a => {
      csvRows.push(`"${a.description}","${a.owner.displayName}",${a.deadline.toLocaleDateString('vi-VN')},${a.priority},${a.status}`)
    })
    
    // Create and download file
    const csvContent = csvRows.join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `MeetMate_Report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
          <button className="btn btn--secondary" onClick={handleExportReport}>
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

      {/* Attention & blockers */}
      <div className="grid grid--2 mb-6">
        <div className="card" style={{ minHeight: 120 }}>
          <div className="card__header">
            <h3 className="card__title">
              <AlertTriangle size={16} className="card__title-icon" />
              Cần chú ý ngay
            </h3>
          </div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!loadingLive && liveMeeting ? (
              <div className="alert alert--info" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="live-indicator">
                  <span className="live-indicator__dot"></span>
                  LIVE
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{liveMeeting.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Users size={12} /> {liveMeeting.participants} người tham gia
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/app/meetings/${liveMeeting.id}/pre`} className="btn btn--ghost btn--sm">Xem</Link>
                  {liveMeeting.teamsLink && (
                    <a href={liveMeeting.teamsLink} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--sm">
                      <Mic size={14} /> Tham gia
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Không có cuộc họp đang diễn ra.</div>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="pill pill--warning">
                {stats?.actionsOverdue ?? 0} actions quá hạn
              </div>
              <div className="pill pill--danger">
                {stats?.risksHigh ?? 0} rủi ro cao/khẩn cấp
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ minHeight: 120 }}>
          <div className="card__header">
            <h3 className="card__title">
              <AlertTriangle size={16} className="card__title-icon" />
              Blockers / Overdue
            </h3>
          </div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {overdueActions.length === 0 ? (
              <div className="empty-state" style={{ padding: '12px 0' }}>
                <div className="empty-state__title" style={{ fontSize: 14 }}>Không có blocker</div>
              </div>
            ) : (
              overdueActions.map(item => (
                <div key={item.id} className="action-item" style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px' }}>
                  <div className="action-item__content">
                    <div className="action-item__title">{item.description}</div>
                    <div className="action-item__meta">
                      <span className={`action-item__priority action-item__priority--${item.priority}`}>
                        {item.priority}
                      </span>
                      <span className="action-item__meta-item">
                        <Clock size={12} /> Quá hạn
                      </span>
                      <span className="action-item__meta-item">
                        <User size={12} /> {item.owner.displayName}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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
              <div className="stats-card__icon stats-card__icon--warning">
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
                <div className="stats-card__label">Tài liệu</div>
                <div className="stats-card__value">{stats?.totalDocs ?? 0}</div>
                <div className="stats-card__trend">
                  {stats?.docsUpdated ?? 0} cập nhật gần đây
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
                    to={`/app/meetings/${meeting.id}/pre`}
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
      <div className="card mb-6">
        <div className="card__header">
          <h3 className="card__title">
            <Lightbulb size={18} className="card__title-icon" />
            AI gợi ý bước tiếp theo
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
                Dự án Core Banking đạt 68% tiến độ. Cần giữ nguồn lực như kế hoạch để không trễ mốc.
              </div>
            </div>
            <div className="insight-box insight-box--warning">
              <div className="insight-box__title">
                <AlertTriangle size={16} />
                Cảnh báo
              </div>
              <div className="insight-box__content">
                {stats?.actionsOverdue ?? 1} action item quá hạn. Ưu tiên đẩy với Tech Lead trong cuộc họp gần nhất.
              </div>
            </div>
            <div className="insight-box insight-box--success">
              <div className="insight-box__title">
                <Lightbulb size={16} />
                Đề xuất
              </div>
              <div className="insight-box__content">
                Mời Security Architect tham gia phiên Risk Review để rà soát API security.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
