'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMe } from './me-store'
import { apiConfig, keycloakConfig } from './config'
import { useNotifications } from './notifications-store'

export type Role = 'admin' | 'manager' | 'developer' | 'user'

export interface AuthUser {
  email: string
  name: string
  role: Role
  avatarIcon: string
}

interface AuthState extends AuthUser {
  initials: string
}

interface AuthContextValue {
  user: AuthState | null
  signedIn: boolean
  hydrated: boolean
  signIn: (email: string) => void
  signOut: () => void
  setAvatarIcon: (icon: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'stackr.auth.avatar'

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .map(p => p[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { me, loaded, reload } = useMe()
  const [user, setUser] = useState<AuthState | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loaded) return

    if (me) {
      let role: Role = 'user'
      if (me.is_super_admin || me.role === 'platform_admin') role = 'admin'
      else if (Object.values(me.tenant_access).includes('admin') || me.can_manage_projects) role = 'manager'
      else if (Object.keys(me.tenant_access).length > 0 || me.role === 'tenant_user') role = 'developer'

      const avatarIcon = (me.avatar_icon && me.avatar_icon !== 'user')
        ? me.avatar_icon
        : (localStorage.getItem(`${STORAGE_KEY}_${me.email}`) || 'user')
      
      setUser(prev => {
        if (prev && prev.email !== me.email) {
          useNotifications.getState().clearAll()
        }
        return {
          email: me.email,
          name: me.name,
          role,
          avatarIcon,
          initials: initialsFrom(me.name)
        }
      })
    } else {
      setUser(null)
      useNotifications.getState().clearAll()
    }
    setHydrated(true)
  }, [me, loaded])

  // signIn is now practically a no-op from the client perspective for real SSO, 
  // but we keep it for dev bypass logic if needed.
  const signIn = useCallback((email: string) => {
    // Relying on page refresh or me-store reload instead in real scenarios.
  }, [])

  const signOut = useCallback(async () => {
    setLoggingOut(true)
    try {
      useNotifications.getState().clearAll()
    } catch (err) {}
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {}
    setUser(null)
    if (keycloakConfig.url) {
      const redirectUri = `${window.location.origin}/login`
      const logoutUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout?client_id=${keycloakConfig.clientId}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}&redirect_uri=${encodeURIComponent(redirectUri)}`
      window.location.href = logoutUrl
    } else {
      router.push('/login')
    }
  }, [router])

  const setAvatarIcon = useCallback(async (icon: string) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, avatarIcon: icon }
      localStorage.setItem(`${STORAGE_KEY}_${updated.email}`, icon)
      return updated
    })
    try {
      await fetch(`${apiConfig.url}/api/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_icon: icon }),
        credentials: 'include'
      })
      await reload()
    } catch (err) {
      console.error('Failed to sync avatar icon to Keycloak:', err)
    }
  }, [reload])

  return (
    <AuthContext.Provider value={{ user, signedIn: !!user, hydrated: hydrated && !loggingOut, signIn, signOut, setAvatarIcon }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export const ROLE_META: Record<Role, { label: string; color: string; bg: string; ring: string }> = {
  admin:     { label: 'Administrator',  color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-500/10',     ring: 'ring-rose-500/30' },
  manager:   { label: 'Project Manager',color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10',  ring: 'ring-emerald-500/30' },
  developer: { label: 'Developer',      color: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-500/10',   ring: 'ring-violet-500/30' },
  user:      { label: 'Standard user',  color: 'text-sky-600 dark:text-sky-400',         bg: 'bg-sky-500/10',      ring: 'ring-sky-500/30' },
}
