import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Radio,
  BookOpen,
  CheckSquare,
  Settings,
  Bot,
  LogOut,
} from 'lucide-react'
import { currentUser, getInitials, actionItems } from '../../store/mockData'
import { logout, getStoredUser } from '../../lib/api/auth'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  badge?: number
}

const mainNavItems: NavItem[] = [
  { path: '/app', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/app/calendar', label: 'Lịch họp', icon: <Calendar size={20} /> },
  { path: '/app/meetings', label: 'Cuộc họp', icon: <Users size={20} /> },
  { path: '/app/live', label: 'Live Meeting', icon: <Radio size={20} /> },
]

const overdueCount = actionItems.filter(a => a.deadline < new Date() && a.status !== 'completed').length

const toolsNavItems: NavItem[] = [
  { path: '/app/knowledge', label: 'Knowledge Hub', icon: <BookOpen size={20} /> },
  { 
    path: '/app/tasks', 
    label: 'Action Items', 
    icon: <CheckSquare size={20} />,
    badge: overdueCount > 0 ? overdueCount : undefined
  },
]

const settingsNavItems: NavItem[] = [
  { path: '/app/settings', label: 'Cài đặt', icon: <Settings size={20} /> },
]

const Sidebar = () => {
  const navigate = useNavigate()
  const storedUser = getStoredUser()
  const displayUser = storedUser || currentUser

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar app-shell__sidebar">
      {/* Logo */}
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <Bot size={20} />
          </div>
          <span className="sidebar__logo-text">MeetMate</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {/* Main Section */}
        <div className="sidebar__nav-section">
          <div className="sidebar__nav-title">Menu chính</div>
          <ul className="sidebar__nav-list">
            {mainNavItems.map((item) => (
              <li key={item.path} className="sidebar__nav-item">
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => 
                    `sidebar__nav-link ${isActive ? 'active' : ''}`
                  }
                  end={item.path === '/app'}
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="sidebar__nav-badge">{item.badge}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Tools Section */}
        <div className="sidebar__nav-section">
          <div className="sidebar__nav-title">Công cụ AI</div>
          <ul className="sidebar__nav-list">
            {toolsNavItems.map((item) => (
              <li key={item.path} className="sidebar__nav-item">
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => 
                    `sidebar__nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="sidebar__nav-badge">{item.badge}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Settings Section */}
        <div className="sidebar__nav-section">
          <div className="sidebar__nav-title">Hệ thống</div>
          <ul className="sidebar__nav-list">
            {settingsNavItems.map((item) => (
              <li key={item.path} className="sidebar__nav-item">
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => 
                    `sidebar__nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {getInitials(displayUser.display_name || displayUser.displayName || 'U')}
          </div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{displayUser.display_name || displayUser.displayName}</div>
            <div className="sidebar__user-role">{displayUser.role || 'User'}</div>
          </div>
          <button 
            className="sidebar__logout-btn" 
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
