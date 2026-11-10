import { create } from 'zustand'
import * as api from '../lib/api'
import { useAuthStore } from './authStore'

export const PAGE_SIZE = 10

type NotesState = {
  notes: api.Note[]
  pagination: api.Pagination | null
  page: number
  loading: boolean
  error: string | null
  fetchNotes: (page?: number) => Promise<void>
  addNote: (title: string, content: string) => Promise<void>
  editNote: (id: string, title: string, content: string) => Promise<void>
  removeNote: (id: string) => Promise<void>
  clear: () => void
}

function getAuth() {
  const { token, user } = useAuthStore.getState()
  if (!token) throw new Error('Not logged in')
  return { token, isAdmin: user?.role === 'admin' }
}

let requestId = 0

export const useNotesStore = create<NotesState>()((set, get) => ({
  notes: [],
  pagination: null,
  page: 1,
  loading: false,
  error: null,

  fetchNotes: async (page = get().page) => {
    const id = ++requestId
    set({ loading: true, error: null, page })
    try {
      const { token, isAdmin } = getAuth()
      const res = await api.fetchNotes(token, isAdmin, page, PAGE_SIZE)
      if (id !== requestId) return

      if (res.notes.length === 0 && page > 1 && res.pagination.totalPages > 0) {
        return get().fetchNotes(Math.min(page - 1, res.pagination.totalPages))
      }
      set({ notes: res.notes, pagination: res.pagination, loading: false })
    } catch (err) {
      if (id !== requestId) return
      set({ error: err instanceof Error ? err.message : 'Failed to load notes', loading: false })
    }
  },

  addNote: async (title, content) => {
    const { token } = getAuth()
    await api.createNote(token, title, content)
    await get().fetchNotes(1)
  },

  editNote: async (id, title, content) => {
    const { token } = getAuth()
    await api.updateNote(token, id, title, content)
    set((state) => ({ notes: state.notes.map((n) => (n._id === id ? { ...n, title, content } : n)) }))
  },

  removeNote: async (id) => {
    const { token } = getAuth()
    await api.deleteNote(token, id)
    await get().fetchNotes()
  },

  clear: () => {
    requestId++
    set({ notes: [], pagination: null, page: 1, loading: false, error: null })
  },
}))
