import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { loginRequest, type User } from '../lib/api'

type AuthState = {
  user: User | null
  token: string | null
  expiresAt: number | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

let logoutTimer: ReturnType<typeof setTimeout> | undefined

function scheduleLogout(expiresAt: number | null, logout: () => void) {
  clearTimeout(logoutTimer)
  if (expiresAt) logoutTimer = setTimeout(logout, Math.max(0, expiresAt - Date.now()))
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      expiresAt: null,

      login: async (email, password) => {
        const { user, token } = await loginRequest(email, password)
        const expiresAt = getTokenExpiry(token)
        set({ user, token, expiresAt })
        scheduleLogout(expiresAt, get().logout)
      },

      logout: () => {
        clearTimeout(logoutTimer)
        set({ user: null, token: null, expiresAt: null })
      },
    }),
    {
      name: 'snt-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ user, token, expiresAt }) => ({ user, token, expiresAt }),
      onRehydrateStorage: () => (state) => {
        if (!state?.token) return
        if (state.expiresAt && state.expiresAt <= Date.now()) state.logout()
        else scheduleLogout(state.expiresAt, state.logout)
      },
    },
  ),
)
