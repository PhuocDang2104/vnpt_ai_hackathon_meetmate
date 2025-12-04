import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/meetings', label: 'Meetings' },
  { path: '/live', label: 'Live Meeting' },
  { path: '/knowledge', label: 'Knowledge Hub' },
  { path: '/tasks', label: 'Tasks' },
  { path: '/settings', label: 'Settings' },
]

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">MeetMate</div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar