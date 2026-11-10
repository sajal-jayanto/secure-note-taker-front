import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { useAuthStore } from './store/authStore'
import { canAccess } from './config/nav'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Notes from './pages/Notes'
import Posts from './pages/Posts'
import AdminSettings from './pages/AdminSettings'
import Profile from './pages/Profile'

const HOME = '/notes'

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function RequireRole({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.role)
  const { pathname } = useLocation()
  return canAccess(role, pathname) ? children : <Navigate to={HOME} replace />
}

function GuestOnly({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <Navigate to={HOME} replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestOnly> <Login /> </GuestOnly>} />
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/notes" element={<RequireRole><Notes /></RequireRole>} />
          <Route path="/posts" element={<RequireRole><Posts /></RequireRole>} />
          <Route path="/profile" element={<RequireRole><Profile /></RequireRole>} />
          <Route path="/admin-settings" element={<RequireRole><AdminSettings /></RequireRole>} />
        </Route>
        <Route path="*" element={<Navigate to={HOME} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
