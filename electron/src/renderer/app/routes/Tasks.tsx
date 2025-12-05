import {
  CheckSquare,
  Clock,
  User,
  AlertTriangle,
  Filter,
  Plus,
  Check,
  ExternalLink,
} from 'lucide-react'
import { actionItems, isOverdue } from '../../store/mockData'

const Tasks = () => {
  const overdue = actionItems.filter(a => isOverdue(a.deadline) && a.status !== 'completed')
  const inProgress = actionItems.filter(a => a.status === 'in_progress')
  const pending = actionItems.filter(a => a.status === 'proposed' || a.status === 'confirmed')

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Action Items</h1>
          <p className="page-header__subtitle">Theo dõi tất cả action items từ các cuộc họp</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--secondary">
            <Filter size={16} />
            Lọc
          </button>
          <button className="btn btn--primary">
            <Plus size={16} />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid--4 mb-6">
        <div className="card stats-card">
          <div className="stats-card__icon stats-card__icon--info">
            <CheckSquare size={22} />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__label">Tổng số</div>
            <div className="stats-card__value">{actionItems.length}</div>
          </div>
        </div>
        <div className="card stats-card">
          <div className="stats-card__icon stats-card__icon--error">
            <AlertTriangle size={22} />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__label">Quá hạn</div>
            <div className="stats-card__value">{overdue.length}</div>
          </div>
        </div>
        <div className="card stats-card">
          <div className="stats-card__icon stats-card__icon--warning">
            <Clock size={22} />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__label">Đang thực hiện</div>
            <div className="stats-card__value">{inProgress.length}</div>
          </div>
        </div>
        <div className="card stats-card">
          <div className="stats-card__icon stats-card__icon--success">
            <Check size={22} />
          </div>
          <div className="stats-card__content">
            <div className="stats-card__label">Hoàn thành</div>
            <div className="stats-card__value">{actionItems.filter(a => a.status === 'completed').length}</div>
          </div>
        </div>
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div className="card mb-6" style={{ borderColor: 'var(--error)', borderLeftWidth: '3px' }}>
          <div className="card__header">
            <h3 className="card__title">
              <AlertTriangle size={18} style={{ color: 'var(--error)' }} />
              Quá hạn
            </h3>
            <span className="badge badge--error">{overdue.length}</span>
          </div>
          <div className="card__body">
            <div className="action-list">
              {overdue.map(action => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* In Progress */}
      <div className="card mb-6">
        <div className="card__header">
          <h3 className="card__title">
            <Clock size={18} className="card__title-icon" />
            Đang thực hiện
          </h3>
          <span className="badge badge--warning">{inProgress.length}</span>
        </div>
        <div className="card__body">
          <div className="action-list">
            {inProgress.map(action => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">
            <CheckSquare size={18} className="card__title-icon" />
            Chờ xử lý
          </h3>
          <span className="badge badge--info">{pending.length}</span>
        </div>
        <div className="card__body">
          <div className="action-list">
            {pending.map(action => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ActionCardProps {
  action: typeof actionItems[0]
}

const ActionCard = ({ action }: ActionCardProps) => {
  const overdue = isOverdue(action.deadline) && action.status !== 'completed'
  
  return (
    <div className="action-item">
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
            {action.owner.displayName}
          </span>
          <span className={`action-item__meta-item ${overdue ? 'action-item__deadline--overdue' : ''}`}>
            <Clock size={12} />
            {overdue ? 'Quá hạn ' : ''}{action.deadline.toLocaleDateString('vi-VN')}
          </span>
          {action.externalLink && (
            <a 
              href={action.externalLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ExternalLink size={12} />
              {action.externalLink.includes('jira') ? 'Jira' : 'Planner'}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default Tasks
