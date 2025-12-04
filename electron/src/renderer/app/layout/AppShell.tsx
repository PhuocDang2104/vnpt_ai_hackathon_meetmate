import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const AppShell = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__main">
        <Topbar />
        <div className="app-shell__content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppShell
