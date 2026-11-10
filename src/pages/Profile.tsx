import { useEffect, useState } from 'react'
import { fetchMe, fetchSharedInterests, type SharedInterest, type User } from '../lib/api'
import { useAuthStore } from '../store/authStore'

type Data = { me: User; shared: SharedInterest[] }

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

// People sorted by how many of my interests they share.
function bestMatches(shared: SharedInterest[]) {
  const byUser = new Map<string, { _id: string; name: string; interests: string[] }>()
  for (const group of shared) {
    for (const u of group.users) {
      const entry = byUser.get(u._id) ?? { ...u, interests: [] }
      entry.interests.push(group.interest)
      byUser.set(u._id, entry)
    }
  }
  return [...byUser.values()].sort((a, b) => b.interests.length - a.interests.length || a.name.localeCompare(b.name))
}

export default function Profile() {
  const token = useAuthStore((s) => s.token)
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!token) return
    let ignore = false
    Promise.all([fetchMe(token), fetchSharedInterests(token)])
      .then(([me, shared]) => {
        if (ignore) return
        setData({ me, shared })
        setError('')
        // Keep the top bar in sync with the latest profile from the server.
        useAuthStore.setState({ user: me })
      })
      .catch((err) => !ignore && setError(err instanceof Error ? err.message : 'Could not load your profile'))
    return () => {
      ignore = true
    }
  }, [token, reloadKey])

  if (error) {
    return (
      <div className="panel empty">
        <p className="error">{error}</p>
        <button className="btn btn-ghost btn-sm" onClick={() => { setError(''); setReloadKey((k) => k + 1) }}>Try again</button>
      </div>
    )
  }

  if (!data) return <div className="empty">Loading profile…</div>

  const { me, shared } = data
  const matches = bestMatches(shared)
  const sharedSet = new Set(shared.filter((g) => g.users.length > 0).map((g) => g.interest))

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>Profile</h1>
          <p>Your account and people who share your interests.</p>
        </div>
      </div>

      <section className="panel profile-card">
        <div className="avatar" aria-hidden="true">{initials(me.name)}</div>
        <div className="profile-info">
          <h2>{me.name}</h2>
          <p className="cell-muted">{me.email}</p>
          <span className={`role-pill role-${me.role}`}>{me.role}</span>
        </div>
        <div className="profile-interests">
          <h3>Interests</h3>
          <div className="chips">
            {me.interests.length === 0 ? (
              <span className="cell-muted">No interests added.</span>
            ) : (
              me.interests.map((i) => (
                <span key={i} className={`chip${sharedSet.has(i) ? ' chip-shared' : ''}`}>{i}</span>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="panel notes-panel">
        <h2 className="posts-heading">People with the same interests</h2>

        {matches.length === 0 ? (
          <div className="empty">Nobody else shares your interests yet.</div>
        ) : (
          <>
            <h3 className="section-label">Most in common</h3>
            <ul className="match-list">
              {matches.map((m) => (
                <li key={m._id} className="match">
                  <div className="avatar avatar-sm" aria-hidden="true">{initials(m.name)}</div>
                  <div className="match-info">
                    <strong>{m.name}</strong>
                    <div className="chips">
                      {m.interests.map((i) => <span key={i} className="chip chip-shared">{i}</span>)}
                    </div>
                  </div>
                  <span className="match-count">
                    {m.interests.length} shared
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  )
}
