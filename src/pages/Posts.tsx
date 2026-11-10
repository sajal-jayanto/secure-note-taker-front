import { useEffect, useState } from 'react'
import Pagination from '../components/Pagination'
import { fetchUserPosts, fetchUsers, type Pagination as PaginationInfo, type Post, type UserSummary } from '../lib/api'
import { useAuthStore } from '../store/authStore'

const PAGE_SIZE = 10

export default function Posts() {
  const token = useAuthStore((s) => s.token)
  const me = useAuthStore((s) => s.user)

  const [users, setUsers] = useState<UserSummary[]>([])
  const [usersError, setUsersError] = useState('')
  const [selectedId, setSelectedId] = useState(me?._id ?? '')
  const [page, setPage] = useState(1)

  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [error, setError] = useState('')

  const requestKey = `${selectedId}:${page}`
  const [loadedKey, setLoadedKey] = useState('')
  const loading = !!selectedId && loadedKey !== requestKey

  useEffect(() => {
    if (!token) return
    let ignore = false
    fetchUsers(token)
      .then((list) => !ignore && setUsers(list.sort((a, b) => a.name.localeCompare(b.name))))
      .catch((err) => !ignore && setUsersError(err instanceof Error ? err.message : 'Could not load users'))
    return () => {
      ignore = true
    }
  }, [token])

  useEffect(() => {
    if (!token || !selectedId) return
    let ignore = false
    const key = `${selectedId}:${page}`
    fetchUserPosts(token, selectedId, page, PAGE_SIZE)
      .then((res) => {
        if (ignore) return
        setPosts(res.posts)
        setPagination(res.pagination)
        setError('')
      })
      .catch((err) => !ignore && setError(err instanceof Error ? err.message : 'Could not load posts'))
      .finally(() => !ignore && setLoadedKey(key))
    return () => {
      ignore = true
    }
  }, [token, selectedId, page])

  const selectUser = (id: string) => {
    setSelectedId(id)
    setPage(1)
    setPosts([])
    setPagination(null)
    setError('')
  }

  const selectedName = users.find((u) => u.id === selectedId)?.name ?? (selectedId === me?._id ? me?.name : undefined)

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>Posts</h1>
          <p>Choose a user to see their posts.</p>
        </div>

        <div className="user-select">
          <label htmlFor="user-select">User</label>
          <select
            id="user-select"
            className="input"
            value={selectedId}
            onChange={(e) => selectUser(e.target.value)}
            disabled={users.length === 0}
          >
            {users.length === 0 && <option value={selectedId}>{usersError ? 'Could not load users' : 'Loading users…'}</option>}
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}{u.id === me?._id ? ' (you)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {usersError && <p className="error">{usersError}</p>}

      <section className="panel notes-panel">
        {selectedName && <h2 className="posts-heading">Posts by {selectedName}</h2>}

        {error ? (
          <div className="empty"><p className="error">{error}</p></div>
        ) : loading && posts.length === 0 ? (
          <div className="empty">Loading posts…</div>
        ) : posts.length === 0 ? (
          <div className="empty">{selectedName ?? 'This user'} hasn’t posted anything yet.</div>
        ) : (
          <section className={`notes${loading ? ' is-loading' : ''}`}>
            {posts.map((p) => (
              <article key={p._id} className="note">
                <h3>{p.title}</h3>
                <p>{p.content}</p>
              </article>
            ))}
          </section>
        )}

        {pagination && !error && <Pagination pagination={pagination} disabled={loading} onChange={setPage} />}
      </section>
    </>
  )
}
