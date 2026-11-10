export type Role = 'admin' | 'user'

export type NavItem = {
  path: string
  label: string
  icon: string
  roles: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/notes', label: 'Notes', icon: '📝', roles: ['admin', 'user'] },
  { path: '/posts', label: 'Posts', icon: '📰', roles: ['admin', 'user'] },
  { path: '/profile', label: 'Profile', icon: '👤', roles: ['admin', 'user'] },
  { path: '/admin-settings', label: 'Admin Settings', icon: '⚙️', roles: ['admin'] },
]

export const canAccess = (role: string | undefined, path: string) =>
  NAV_ITEMS.some((item) => item.path === path && item.roles.includes(role as Role))
