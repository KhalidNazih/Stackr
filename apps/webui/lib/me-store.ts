'use client'

import React, { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { apiConfig } from './config'

export interface MeInfo {
  email: string
  name: string
  role: 'platform_admin' | 'tenant_user' | 'guest'
  is_super_admin: boolean
  /** {tenant_id: 'admin' | 'user'} — derived from Keycloak groups */
  tenant_access: Record<string, 'admin' | 'user'>
  groups: string[]
  can_manage_projects: boolean
  auth_source: 'keycloak' | 'dev_auth' | 'none'
  registered: boolean
  department?: string
  location?: string
  avatar_icon?: string
}

interface MeContextValue {
  me: MeInfo | null
  loaded: boolean
  error: string | null
  reload: () => Promise<void>
}

const MeContext = createContext<MeContextValue | null>(null)

export function MeProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeInfo | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`${apiConfig.url}/api/me`, {
        credentials: 'include', // forward dev_auth/access_token cookies
      })
      if (res.ok) {
        setMe(await res.json())
      } else if (res.status === 401) {
        setMe(null)
      } else {
        setError(`Backend returned ${res.status}`)
      }
    } catch {
      setError('Could not reach backend')
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return React.createElement(
    MeContext.Provider,
    { value: { me, loaded, error, reload: load } },
    children
  )
}

export function useMe() {
  const ctx = useContext(MeContext)
  if (!ctx) {
    throw new Error('useMe must be used within a MeProvider')
  }
  return ctx
}

// ── Helpers used by pages to gate visibility ───────────────────────────────
export function visibleTenantIds(me: MeInfo | null): string[] | null {
  // null = sees everything (super admin); empty array = sees nothing
  if (!me) return []
  if (me.is_super_admin) return null
  return Object.keys(me.tenant_access)
}

export function tenantRole(me: MeInfo | null, tenantId: string): 'admin' | 'user' | null {
  if (!me) return null
  if (me.is_super_admin) return 'admin'
  return me.tenant_access[tenantId] ?? null
}

export function filterVisibleTenants(me: MeInfo | null, tenants: any[]): any[] {
  if (!me) return []
  if (me.is_super_admin) return tenants
  
  const allowed = Object.keys(me.tenant_access || {}).map(id => id.toLowerCase())
  const userEmail = me.email.toLowerCase()
  
  return tenants.filter(t => {
    const isAllowedGroup = allowed.includes(t.id.toLowerCase())
    const isOwner = t.owner.toLowerCase() === userEmail
    const isDeveloper = (t.developers || []).map((d: string) => d.toLowerCase()).includes(userEmail)
    return isAllowedGroup || isOwner || isDeveloper
  })
}
