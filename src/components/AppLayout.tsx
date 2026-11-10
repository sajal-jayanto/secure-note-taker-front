import { Link, NavLink, Outlet } from 'react-router'
import { NAV_ITEMS, type Role } from '../config/nav'
import { useAuthStore } from '../store/authStore'
import { useNotesStore } from '../store/notesStore'

export default function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const clearNotes = useNotesStore((s) => s.clear)

  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role as Role))

  const handleLogout = () => {
    clearNotes()
    logout()
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="brand">🔒 Secure Notes</span>
        <div className="user">
          <Link to="/profile" className="topbar-name" title={user?.email}>{user?.name}</Link>
          <span className="role-badge">{user?.role}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar">
          {items.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="dashboard">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
