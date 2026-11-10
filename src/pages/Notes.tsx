import { useEffect, useState, type SubmitEvent } from 'react'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { PencilIcon, TrashIcon } from '../components/icons'
import { useAuthStore } from '../store/authStore'
import { useNotesStore } from '../store/notesStore'
import type { Note } from '../lib/api'

const ownerOf = (note: Note) => (typeof note.userId === 'string' ? null : note.userId)
const ownerIdOf = (note: Note) => (typeof note.userId === 'string' ? note.userId : note.userId._id)

export default function Notes() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const { notes, pagination, loading, error, fetchNotes, addNote, editNote, removeNote } = useNotesStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchNotes(1)
  }, [fetchNotes, isAdmin])

  const openCreate = () => {
    if (editingId) {
      setTitle('')
      setContent('')
    }
    setEditingId(null)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (note: Note) => {
    setEditingId(note._id)
    setTitle(note.title)
    setContent(note.content)
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      if (editingId) await editNote(editingId, title.trim(), content.trim())
      else await addNote(title.trim(), content.trim())
      setEditingId(null)
      setTitle('')
      setContent('')
      setModalOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save note')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return
    setDeletingId(id)
    try {
      await removeNote(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete note')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>{isAdmin ? 'All Notes' : 'My Notes'}</h1>
          <p>{isAdmin ? 'Notes from every user.' : 'Your notes, kept private.'}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New note</button>
      </div>

      <Modal open={modalOpen} title={editingId ? 'Edit note' : 'New note'} onClose={closeModal}>
        <form className="new-note" onSubmit={handleSubmit}>
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          <textarea className="input" placeholder="Write something…" value={content} onChange={(e) => setContent(e.target.value)} required />
          {formError && <p className="error">{formError}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save note'}
            </button>
          </div>
        </form>
      </Modal>

      <section className="panel notes-panel">
      {error ? (
        <div className="empty">
          <p className="error">{error}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchNotes()}>Try again</button>
        </div>
      ) : loading && notes.length === 0 ? (
        <div className="empty">Loading notes…</div>
      ) : notes.length === 0 ? (
        <div className="empty">No notes yet. Click “+ New note” to create one.</div>
      ) : (
        <section className={`notes${loading ? ' is-loading' : ''}`}>
          {notes.map((n) => {
            const owner = ownerOf(n)
            const isMine = ownerIdOf(n) === user?._id
            return (
              <article key={n._id} className="note">
                <h3>{n.title}</h3>
                <p>{n.content}</p>
                <div className="meta">
                  <span title={owner?.email}>{isAdmin && owner ? `By ${owner.name}` : ''}</span>
                  {isMine && (
                    <div className="note-actions">
                      <button className="icon-btn icon-btn-edit" disabled={deletingId === n._id} onClick={() => openEdit(n)}>
                        <PencilIcon />
                        Edit
                      </button>
                      <button className="icon-btn icon-btn-delete" disabled={deletingId === n._id} onClick={() => handleDelete(n._id)}>
                        <TrashIcon />
                        {deletingId === n._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}

      {pagination && !error && (
        <Pagination pagination={pagination} disabled={loading} onChange={(p) => fetchNotes(p)} />
      )}
      </section>
    </>
  )
}
