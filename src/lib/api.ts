const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options: RequestInit & { token?: string | null } = {}): Promise<T> {
  const { token, headers, ...rest } = options
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const details = data?.details ? Object.values(data.details as Record<string, string[]>).flat().join(' ') : ''
    const message = data?.message ?? data?.error ?? `Request failed (${res.status})`
    throw new ApiError(res.status, details ? `${message}: ${details}` : message)
  }
  return data as T
}

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export type User = {
  _id: string
  name: string
  email: string
  role: string
  interests: string[]
}

export type LoginResponse = { user: User; token: string }

export const loginRequest = (email: string, password: string) =>
  apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })



export type NoteOwner = { _id: string; name: string; email: string }

export type Note = {
  _id: string
  userId: NoteOwner | string
  title: string
  content: string
}

export type NotesResponse = { notes: Note[]; pagination: Pagination }

export const fetchNotes = (token: string, isAdmin: boolean, page: number, limit: number) =>
  apiRequest<NotesResponse>(`${isAdmin ? '/admin/notes' : '/notes'}?page=${page}&limit=${limit}`, { token })

export const createNote = (token: string, title: string, content: string) =>
  apiRequest<Note>('/notes', { method: 'POST', token, body: JSON.stringify({ title, content }) })

export const updateNote = (token: string, id: string, title: string, content: string) =>
  apiRequest<unknown>(`/notes/${id}`, { method: 'PATCH', token, body: JSON.stringify({ title, content }) })

// ---- Admin: user management ----

export type UserInput = {
  name: string
  email: string
  password?: string // required on create; omit on update to keep the current one
  role: 'user' | 'admin'
  interests: string[]
}

export const fetchAdminUsers = (token: string, page: number, limit: number) =>
  apiRequest<{ users: User[]; pagination: Pagination }>(`/admin/users?page=${page}&limit=${limit}`, { token })

export const createUser = (token: string, input: UserInput) =>
  apiRequest<unknown>('/admin/user', { method: 'POST', token, body: JSON.stringify(input) })

export const updateUser = (token: string, id: string, input: Partial<UserInput>) =>
  apiRequest<unknown>(`/admin/user/${id}`, { method: 'PATCH', token, body: JSON.stringify(input) })

export const deleteUser = (token: string, id: string) =>
  apiRequest<unknown>(`/admin/user/${id}`, { method: 'DELETE', token })

// ---- Profile ----

export const fetchMe = (token: string) =>
  apiRequest<{ user: User }>('/users/me', { token }).then((res) => res.user)

// For each of the current user's interests, the other users who share it.
export type SharedInterest = {
  interest: string
  count: number
  users: { _id: string; name: string }[]
}

export const fetchSharedInterests = (token: string) =>
  apiRequest<{ interests: SharedInterest[] }>('/users/interests', { token }).then((res) => res.interests)

// ---- Users & posts ----

export type UserSummary = { id: string; name: string }

export const fetchUsers = (token: string) =>
  apiRequest<{ users: UserSummary[] }>('/users', { token }).then((res) => res.users)

export type Post = { _id: string; title: string; content: string }

export type UserPostsResponse = {
  user: { _id: string; name: string }
  posts: Post[]
  pagination: Pagination
}

export const fetchUserPosts = (token: string, userId: string, page: number, limit: number) =>
  apiRequest<UserPostsResponse>(`/users/${userId}/posts?page=${page}&limit=${limit}`, { token })

export const deleteNote = (token: string, id: string) =>
  apiRequest<unknown>(`/notes/${id}`, { method: 'DELETE', token })
