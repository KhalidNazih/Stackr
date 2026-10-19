'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Role } from './auth-context'
import { apiConfig } from './config'

export interface PlatformUser {
  id?: string
  email: string
  name: string
  keycloakId?: string
  role: Role
  canManageProjects: boolean
  enabled: boolean
  grantedBy: string
  grantedAt: string
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'user'
  return local.split(/[._-]+/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

function mapApiUser(u: Record<string, unknown>): PlatformUser {
  return {
    id: u.id as string,
    email: u.email as string,
    name: nameFromEmail(u.email as string),
    role: u.role as Role,
    canManageProjects: Boolean(u.can_manage_projects),
    enabled: Boolean(u.enabled),
    grantedBy: 'system',
    grantedAt: (u.created_at as string) ?? new Date().toISOString(),
  }
}

export function usePlatformUsers() {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    try {
      const [dbRes, kcRes, tenantsRes] = await Promise.all([
        fetch(`${apiConfig.url}/api/platform-users`),
        fetch(`${apiConfig.url}/api/keycloak/users`),
        fetch(`${apiConfig.url}/api/gitlab/registry`)
      ])
      
      let dbUsers: PlatformUser[] = []
      if (dbRes.ok) dbUsers = (await dbRes.json()).map(mapApiUser)

      let tenants: any[] = []
      if (tenantsRes.ok) tenants = await tenantsRes.json()

      const groupPromises: Promise<{ email: string; groupRole: 'admin' | 'user' }[]>[] = []
      tenants.forEach((t: any) => {
        const tid = t.tenant_id
        const manifest = t.manifest || {}
        const adminGroup = manifest.access?.groups?.admins || `${tid}-admins`
        const userGroup = manifest.access?.groups?.users || `${tid}-users`

        groupPromises.push(
          fetch(`${apiConfig.url}/api/keycloak/groups/${adminGroup}/members`)
            .then(res => res.ok ? res.json() : [])
            .then(members => members.map((m: any) => ({ email: m.email || m.username, groupRole: 'admin' as const })))
        )
        groupPromises.push(
          fetch(`${apiConfig.url}/api/keycloak/groups/${userGroup}/members`)
            .then(res => res.ok ? res.json() : [])
            .then(members => members.map((m: any) => ({ email: m.email || m.username, groupRole: 'user' as const })))
        )
      })

      const groupResults = await Promise.all(groupPromises)
      const userRolesMapping: Record<string, { isManager: boolean; isDeveloper: boolean }> = {}

      groupResults.flat().forEach(item => {
        if (!item.email) return
        const email = item.email.toLowerCase()
        if (!userRolesMapping[email]) {
          userRolesMapping[email] = { isManager: false, isDeveloper: false }
        }
        if (item.groupRole === 'admin') {
          userRolesMapping[email].isManager = true
        } else if (item.groupRole === 'user') {
          userRolesMapping[email].isDeveloper = true
        }
      })
      
      let finalUsers: PlatformUser[] = []
      if (kcRes.ok) {
        const kcUsers = await kcRes.json()
        finalUsers = kcUsers.map((kc: any) => {
          const email = (kc.email || kc.username).toLowerCase()
          const dbU = dbUsers.find(u => u.email.toLowerCase() === email)
          const name = kc.firstName && kc.lastName 
            ? `${kc.firstName} ${kc.lastName}` 
            : (dbU?.name || nameFromEmail(email))
            
          const mapping = userRolesMapping[email]
          let resolvedRole: Role = 'user'
          if (dbU?.role === 'admin') {
            resolvedRole = 'admin'
          } else if (mapping?.isManager || dbU?.canManageProjects) {
            resolvedRole = 'manager'
          } else if (mapping?.isDeveloper || dbU?.role === 'developer') {
            resolvedRole = 'developer'
          } else if (dbU?.role) {
            resolvedRole = dbU.role as Role
          }

          return {
            id: dbU?.id,
            email,
            name,
            keycloakId: kc.id,
            role: resolvedRole,
            canManageProjects: dbU?.canManageProjects || !!mapping?.isManager,
            enabled: dbU ? dbU.enabled : true,
            grantedBy: dbU ? dbU.grantedBy : 'system',
            grantedAt: dbU ? dbU.grantedAt : new Date().toISOString(),
          }
        })
        dbUsers.forEach(dbU => {
          if (!finalUsers.find(f => f.email.toLowerCase() === dbU.email.toLowerCase())) finalUsers.push(dbU)
        })
      } else {
        finalUsers = dbUsers
      }
      setUsers(finalUsers)
    } catch (err) {
      console.error('Failed to load platform users:', err)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const grant = useCallback(async (u: Partial<PlatformUser> & { email: string }) => {
    try {
      const res = await fetch(`${apiConfig.url}/api/platform-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: u.email,
          role: u.role || 'user',
          can_manage_projects: u.canManageProjects || false,
          enabled: u.enabled !== false,
        }),
      })
      if (res.ok) await load()
    } catch (err) {
      console.error('Failed to grant user access:', err)
    }
  }, [load])

  const revoke = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${apiConfig.url}/api/platform-users/email/${encodeURIComponent(email)}`, { method: 'DELETE' })
      if (res.ok) setUsers(prev => prev.filter(u => u.email.toLowerCase() !== email.toLowerCase()))
    } catch (err) {
      console.error('Failed to revoke user access:', err)
    }
  }, [])

  const patch = useCallback(async (email: string, body: Record<string, unknown>) => {
    const user = users.find(u => u.email === email)
    if (!user) return
    if (!user.id) {
      await grant({
        email,
        role: (body.role as Role) || user.role,
        canManageProjects: body.can_manage_projects !== undefined ? !!body.can_manage_projects : user.canManageProjects,
        enabled: body.enabled !== undefined ? !!body.enabled : user.enabled
      })
      return
    }
    try {
      const res = await fetch(`${apiConfig.url}/api/platform-users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) await load()
    } catch (err) {
      console.error('Failed to update user:', err)
    }
  }, [users, load, grant])

  const setEnabled = useCallback((email: string, enabled: boolean) => patch(email, { enabled }), [patch])
  const setRole = useCallback((email: string, role: Role) => {
    if (role === 'manager') {
      return patch(email, { role: 'user', can_manage_projects: true })
    } else if (role === 'admin') {
      return patch(email, { role: 'admin', can_manage_projects: false })
    } else if (role === 'developer') {
      return patch(email, { role: 'developer', can_manage_projects: false })
    } else {
      return patch(email, { role: 'user', can_manage_projects: false })
    }
  }, [patch])
  const setCanManage = useCallback((email: string, canManageProjects: boolean) => patch(email, { can_manage_projects: canManageProjects }), [patch])

  return { users, loaded, grant, revoke, setEnabled, setRole, setCanManage }
}
