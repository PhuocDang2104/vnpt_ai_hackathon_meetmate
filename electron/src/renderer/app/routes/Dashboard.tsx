/**
 * Home - Minimal overview focused on what's important
 */
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, CheckSquare, Clock, Lightbulb, Sparkles, User } from 'lucide-react'
import { actionItems, isOverdue } from '../../store/mockData'
import { useUpcomingMeetings, type NormalizedMeeting } from '../../services/meeting'

const formatShortDate = (date: Date) =>
  date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })

const Dashboard = () => {
  const { data: upcomingMeetings, isLoading: loadingMeetings } = useUpcomingMeetings(3)
  const myTasks = actionItems
    .filter(item => item.status !== 'completed' && item.status !== 'cancelled')
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, 4)

  const suggestions = [
    {
      title: 'Tóm tắt cuộc họp gần nhất',
      description: 'Tổng hợp quyết định, action items và người phụ trách trong 60 giây.',
    },
    {
      title: 'Chuẩn bị agenda tuần này',
      description: 'Gợi ý agenda dựa trên lịch họp và tài liệu liên quan.',
    },
    {
      title: 'Rà soát action items quá hạn',
      description: 'Ưu tiên những việc có rủi ro trễ deadline.',
    },
  ]

  return (
    <div className="home-page">
      <div className="home-header">
        <div>
          <h1 className="home-title">Home</h1>
          <p className="home-subtitle">Tập trung vào những điểm quan trọng hôm nay.</p>
        </div>
      </div>

      <div className="home-ask">
        <Sparkles size={18} className="home-ask__icon" />
        <input
          className="home-ask__input"
          placeholder="Hôm nay bạn thế nào? Chia sẻ hay muốn hỏi gì không?"
        />
        <button className="home-ask__btn">Gửi</button>
      </div>

      <div className="home-grid">
        <section className="home-panel">
          <div className="home-panel__header">
            <div className="home-panel__title">
              <Calendar size={18} />
              Upcoming meetings
            </div>
            <Link to="/app/meetings" className="home-panel__link">
              Xem tất cả
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="home-panel__body">
            {loadingMeetings ? (
              <div className="home-skeleton-list">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="home-skeleton-row" />
                ))}
              </div>
            ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
              <ul className="home-meeting-list">
                {upcomingMeetings.map((meeting: NormalizedMeeting) => (
                  <li key={meeting.id} className="home-meeting-item">
                    <div className="home-meeting-time">
                      <div className="home-meeting-hour">{meeting.start}</div>
                      <div className="home-meeting-date">{formatShortDate(meeting.startTime)}</div>
                    </div>
                    <div className="home-meeting-content">
                      <div className="home-meeting-title">{meeting.title}</div>
                      <div className="home-meeting-meta">
                        <span>{meeting.location || 'Online'}</span>
                        <span>{meeting.participants} người</span>
                      </div>
                    </div>
                    <Link to={`/app/meetings/${meeting.id}/detail`} className="home-meeting-link">
                      Xem
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="home-empty">Không có cuộc họp sắp tới.</div>
            )}
          </div>
        </section>

        <section className="home-panel">
          <div className="home-panel__header">
            <div className="home-panel__title">
              <CheckSquare size={18} />
              My tasks
            </div>
            <Link to="/app/tasks" className="home-panel__link">
              Xem tất cả
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="home-panel__body">
            {myTasks.length === 0 ? (
              <div className="home-empty">Bạn chưa có nhiệm vụ nào.</div>
            ) : (
              <ul className="home-task-list">
                {myTasks.map(task => {
                  const overdue = isOverdue(task.deadline)
                  return (
                    <li key={task.id} className="home-task-item">
                      <div className={`home-task-dot ${overdue ? 'home-task-dot--overdue' : ''}`} />
                      <div className="home-task-content">
                        <div className="home-task-title">{task.description}</div>
                        <div className="home-task-meta">
                          <span>
                            <User size={12} /> {task.owner.displayName.split(' ').slice(-1)[0]}
                          </span>
                          <span className={overdue ? 'home-task-meta--overdue' : ''}>
                            <Clock size={12} /> {overdue ? 'Quá hạn' : formatShortDate(task.deadline)}
                          </span>
                        </div>
                      </div>
                      <span className={`home-pill ${overdue ? 'home-pill--danger' : ''}`}>
                        {overdue ? 'Quá hạn' : 'Đang xử lý'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="home-panel home-panel--suggested">
        <div className="home-panel__header">
          <div className="home-panel__title">
            <Lightbulb size={18} />
            AI Suggested for you
          </div>
        </div>
        <div className="home-panel__body">
          <div className="home-suggestions">
            {suggestions.map(item => (
              <div key={item.title} className="home-suggestion">
                <div className="home-suggestion__title">{item.title}</div>
                <p className="home-suggestion__desc">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
