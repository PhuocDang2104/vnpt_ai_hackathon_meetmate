import { useLocation } from 'react-router-dom'
import { Search, Bell, HelpCircle, Home, ChevronRight } from 'lucide-react'

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/calendar': 'Lịch họp',
  '/meetings': 'Cuộc họp',
  '/live': 'Live Meeting',
  '/knowledge': 'Knowledge Hub',
  '/tasks': 'Action Items',
  '/settings': 'Cài đặt',
}

const Topbar = () => {
  const location = useLocation()
  const currentPath = location.pathname
  const pageTitle = routeTitles[currentPath] || 'MeetMate'

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__breadcrumb">
          <Home size={14} />
          <ChevronRight size={14} />
          <span className="topbar__breadcrumb-current">{pageTitle}</span>
        </div>
        
        <div className="topbar__search">
          <Search size={16} className="topbar__search-icon" />
          <input 
            type="text" 
            className="topbar__search-input" 
            placeholder="Tìm kiếm cuộc họp, tài liệu, action items..." 
          />
        </div>
      </div>

      <div className="topbar__right">
        {/* AI Status */}
        <div className="topbar__status">
          <span className="topbar__status-dot"></span>
          <span>AI Ready</span>
        </div>

        {/* Notifications */}
        <button className="topbar__icon-btn topbar__icon-btn--badge" title="Thông báo">
          <Bell size={18} />
        </button>

        {/* Help */}
        <button className="topbar__icon-btn" title="Trợ giúp">
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  )
}

export default Topbar
