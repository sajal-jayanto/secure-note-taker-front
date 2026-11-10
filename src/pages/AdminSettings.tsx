import { useCallback, useEffect, useState, type SubmitEvent } from 'react'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { PencilIcon, TrashIcon } from '../components/icons'
import {
  createUser,
  deleteUser,
  fetchAdminUsers,
  updateUser,
  type Pagination as PaginationInfo,
  type User,
  type UserInput,
} from '../lib/api'
import { useAuthStore } from '../store/authStore'

const PAGE_SIZE = 10

type FormState = { name: string; email: string; password: string; role: 'user' | 'admin'; interests: string }
const EMPTY_FORM: FormState = { name: '', email: '', password: '', role: 'user', interests: '' }

const parseInterests = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

export default function AdminSettings() {
  const token = useAuthStore((s) => s.token)
  const me = useAuthStore((s) => s.user)

  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null) // null = creating
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(
    async (p: number) => {
      if (!token) return
      setLoading(true)
      try {
        const res = await fetchAdminUsers(token, p, PAGE_SIZE)
        // Deleting the last user on a page leaves it empty — step back one.
        if (res.users.length === 0 && p > 1 && res.pagination.totalPages > 0) {
          setPage(Math.min(p - 1, res.pagination.totalPages))
          return
        }
        setUsers(res.users)
        setPagination(res.pagination)
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load users')
      } finally {
        setLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching data for the current page
    load(page)
  }, [load, page])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role as 'user' | 'admin', interests: u.interests.join(', ') })
    setFormError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!token) return
    setFormError('')
    setSaving(true)
    const input: UserInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      interests: parseInterests(form.interests),
      ...(form.password ? { password: form.password } : {}),
    }
    try {
      if (editing) {
        await updateUser(token, editing._id, input)
        // Keep the top bar in sync if admins edit their own account.
        if (editing._id === me?._id && me) {
          useAuthStore.setState({ user: { ...me, name: input.name, email: input.email, interests: input.interests } })
        }
        await load(page)
      } else {
        await createUser(token, input)
        await load(page)
      }
      setModalOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u: User) => {
    if (!token || !confirm(`Delete ${u.name} (${u.email})? This can't be undone.`)) return
    setDeletingId(u._id)
    try {
      await deleteUser(token, u._id)
      await load(page)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete user')
    } finally {
      setDeletingId(null)
    }
  }

  const editingSelf = editing?._id === me?._id

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>Admin Settings</h1>
          <p>Create, edit and remove user accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New user</button>
      </div>

      <Modal open={modalOpen} title={editing ? `Edit ${editing.name}` : 'New user'} onClose={() => setModalOpen(false)}>
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="u-name">Name</label>
            <input id="u-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="u-email">Email</label>
            <input id="u-email" type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="u-password">Password</label>
            <input
              id="u-password"
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder={editing ? 'Leave blank to keep the current password' : 'At least 8 characters'}
              minLength={8}
              required={!editing}
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor="u-role">Role</label>
            <select id="u-role" className="input" value={form.role} onChange={(e) => set('role', e.target.value as 'user' | 'admin')} disabled={editingSelf}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {editingSelf && <small className="hint">You can’t change your own role.</small>}
          </div>
          <div className="field">
            <label htmlFor="u-interests">Interests</label>
            <input id="u-interests" className="input" value={form.interests} onChange={(e) => set('interests', e.target.value)} placeholder="e.g. cooking, travel, music" />
            <small className="hint">Separate with commas.</small>
          </div>

          {formError && <p className="error">{formError}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
            </button>
          </div>
        </form>
      </Modal>

      <section className="panel notes-panel">
        <h2 className="posts-heading">Users{pagination ? ` (${pagination.total})` : ''}</h2>

        {error ? (
          <div className="empty">
            <p className="error">{error}</p>
            <button className="btn btn-ghost btn-sm" onClick={() => load(page)}>Try again</button>
          </div>
        ) : loading && users.length === 0 ? (
          <div className="empty">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="empty">No users yet.</div>
        ) : (
          <div className={`table-wrap${loading ? ' is-loading' : ''}`}>
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Interests</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMe = u._id === me?._id
                  return (
                    <tr key={u._id}>
                      <td className="cell-name">{u.name}{isMe && <span className="you-tag">you</span>}</td>
                      <td className="cell-muted">{u.email}</td>
                      <td><span className={`role-pill role-${u.role}`}>{u.role}</span></td>
                      <td>
                        <div className="chips">
                          {u.interests.length === 0 ? <span className="cell-muted">—</span> : u.interests.map((i) => <span key={i} className="chip">{i}</span>)}
                        </div>
                      </td>
                      <td>
                        <div className="note-actions">
                          <button className="icon-btn icon-btn-edit" onClick={() => openEdit(u)} disabled={deletingId === u._id}>
                            <PencilIcon /> Edit
                          </button>
                          <button
                            className="icon-btn icon-btn-delete"
                            onClick={() => handleDelete(u)}
                            disabled={isMe || deletingId === u._id}
                            title={isMe ? 'You can’t delete your own account' : undefined}
                          >
                            <TrashIcon /> {deletingId === u._id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && !error && <Pagination pagination={pagination} disabled={loading} onChange={setPage} />}
      </section>
    </>
  )
}
