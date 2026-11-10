import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../store/authStore'

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@example.com', password: 'Password123!' },
  { label: 'User', email: 'lina.tanaka.8@example.com', password: 'Password123!' },
]

export default function Login() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/notes', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo">🔒</div>
        <h1>Secure Notes</h1>
        <p className="subtitle">Sign in to access your private notes</p>

        <div className="demo-accounts">
          <strong>Demo accounts</strong>
          {DEMO_ACCOUNTS.map((acc) => (
            <div key={acc.email} className="demo-hint">
              <div>
                <span className="role-badge">{acc.label}</span>
                <div>Email: <code>{acc.email}</code></div>
                <div>Password: <code>{acc.password}</code></div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => { setEmail(acc.email); setPassword(acc.password) }}>
                Fill in
              </button>
            </div>
          ))}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="input" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" className="input" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
