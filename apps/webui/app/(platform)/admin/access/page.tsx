'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserPlus, Search, Shield, Crown, Code2, Eye, MoreHorizontal,
  CheckCircle2, XCircle, AlertCircle, Mail, ChevronDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth, type Role } from '@/lib/auth-context'
import { usePlatformUsers, type PlatformUser } from '@/lib/platform-users-store'
import { useProjects } from '@/lib/projects-store'
import { canManageUsers } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/i18n-context'
import { useEffect } from 'react'
import { useMe } from '@/lib/me-store'
import { apiConfig } from '@/lib/config'
import { useTenants } from '@/lib/tenants-store'

export default function AccessManagementPage() {
  const { user } = useAuth()
  const { me } = useMe()
  const { t, locale } = useT()
  const { users, loaded, grant, revoke, setRole, setCanManage, setEnabled } = usePlatformUsers()
  const { tenants, loaded: tenantsLoaded } = useTenants()
  const [query, setQuery] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [tenantMembers, setTenantMembers] = useState<{ email: string, name: string, tenantRole: 'admin' | 'user' }[]>([])
  const [managerAllowedEmails, setManagerAllowedEmails] = useState<Set<string> | null>(null)

  const ROLE_OPTIONS = [
    { value: 'admin' as Role,     label: t('role.admin'), icon: Crown, color: 'text-rose-500' },
    { value: 'manager' as Role,   label: t('role.manager'), icon: Shield, color: 'text-emerald-500' },
    { value: 'developer' as Role, label: t('role.developer'), icon: Code2, color: 'text-violet-500' },
    { value: 'user' as Role,      label: t('role.viewer'), icon: Eye, color: 'text-sky-500' },
  ]

  useEffect(() => {
    async function loadAllowed() {
      if (!me || me.is_super_admin || me.role === 'platform_admin' || !tenantsLoaded) {
        if (!me) setManagerAllowedEmails(null)
        return
      }
      const allowed = new Set<string>()
      const members: { email: string, name: string, tenantRole: 'admin' | 'user' }[] = []
      const promises: Promise<{ data: any[], role: 'admin' | 'user' }>[] = []

      // Determine which tenant IDs to query groups for.
      // Primary: from me.tenant_access (Keycloak groups parsed by /api/me)
      // Fallback: check ALL tenants in registry and query their groups
      let tenantIds = Object.keys(me.tenant_access || {})
      
      if (tenantIds.length === 0) {
        // Keycloak groups mapper might not be configured, so fall back:
        // query ALL tenant groups and see which ones contain members
        tenantIds = tenants.map(t => t.id)
      }
      
      for (const tid of tenantIds) {
        const tenant = tenants.find(t => t.id === tid)
        const manifest = tenant?.manifest as any
        const adminGroup = manifest?.access?.groups?.admins || `${tid}-admins`
        const userGroup = manifest?.access?.groups?.users || `${tid}-users`

        promises.push(
          fetch(`${apiConfig.url}/api/keycloak/groups/${adminGroup}/members`)
            .then(res => res.ok ? res.json() : [])
            .then(data => ({ data, role: 'admin' as const }))
        )
        promises.push(
          fetch(`${apiConfig.url}/api/keycloak/groups/${userGroup}/members`)
            .then(res => res.ok ? res.json() : [])
            .then(data => ({ data, role: 'user' as const }))
        )
      }
      try {
        const results = await Promise.all(promises)
        for (const result of results) {
          for (const member of result.data) {
            const email = member.email || member.username
            if (email) {
              allowed.add(email)
              if (!members.find(m => m.email === email)) {
                members.push({ email, name: member.firstName ? `${member.firstName} ${member.lastName || ''}`.trim() : member.username, tenantRole: result.role })
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load group members:', err)
      }
      setManagerAllowedEmails(allowed)
      setTenantMembers(members)
    }
    loadAllowed()
  }, [me, tenants, tenantsLoaded])

  if (!user) return null

  const platformUser = users.find(u => u.email === user.email)
  const isManager = platformUser?.canManageProjects || user.role === 'admin' || user.role === 'manager'

  if (!isManager) {
    return (
      <Card className="py-16 text-center">
        <Shield size={32} className="mx-auto mb-3 text-rose-400" />
        <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{t('access.denied')}</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('access.deniedDesc')}
        </p>
      </Card>
    )
  }

  let displayUsers = users
  if (user.role !== 'admin') {
    // For managers, construct PlatformUser objects from Keycloak members
    displayUsers = tenantMembers.map(tm => {
      const pUser = users.find(u => u.email === tm.email)
      return {
        email: tm.email,
        name: pUser?.name || tm.name || tm.email,
        role: pUser ? pUser.role : 'developer',
        canManageProjects: tm.tenantRole === 'admin',
        enabled: pUser ? pUser.enabled : true,
        grantedBy: pUser ? pUser.grantedBy : 'system',
        grantedAt: pUser ? pUser.grantedAt : new Date().toISOString()
      }
    })
  }

  const filtered = displayUsers.filter(u => {
    return !query.trim() || 
           u.name.toLowerCase().includes(query.toLowerCase()) || 
           u.email.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t('access.title')}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {user.role === 'admin' 
              ? t('access.subtitleAdmin')
              : t('access.subtitleManager')}
          </p>
        </div>
        {isManager && (
          <Button variant="primary" size="md" onClick={() => setShowInvite(true)}>
            <UserPlus size={13} /> {t('access.grantAccess')}
          </Button>
        )}
      </div>

      {/* Stats */}
      {user.role === 'admin' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t('access.totalUsers'), value: users.length, color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10' },
            { label: t('access.admins'), value: users.filter(u => u.role === 'admin').length, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: t('access.managers'), value: users.filter(u => u.canManageProjects).length, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: t('access.devsViewers'), value: users.filter(u => u.role !== 'admin').length, color: 'text-sky-500', bg: 'bg-sky-500/10' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg mb-2', s.bg)}>
                <Shield size={14} className={s.color} strokeWidth={2.2} />
              </div>
              <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: t('access.totalTeam'), value: tenantMembers.length, color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10' },
            { label: t('access.tenantAdmins'), value: tenantMembers.filter(m => m.tenantRole === 'admin').length, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: t('access.tenantDevs'), value: tenantMembers.filter(m => m.tenantRole === 'user').length, color: 'text-sky-500', bg: 'bg-sky-500/10' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg mb-2', s.bg)}>
                <Shield size={14} className={s.color} strokeWidth={2.2} />
              </div>
              <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + invite */}
      {showInvite && (
        <InviteCard
          ROLE_OPTIONS={ROLE_OPTIONS}
          onCancel={() => setShowInvite(false)}
          onGrant={async (u, tenantId) => {
            if (user.role === 'admin' && !tenantId) {
              await grant(u)
            } else if (tenantId) {
              const tenant = tenants.find(t => t.id === tenantId)
              if (tenant) {
                const manifest = tenant.manifest as any
                const targetGroup = u.canManageProjects 
                  ? (manifest?.access?.groups?.admins || `${tenantId}-admins`)
                  : (manifest?.access?.groups?.users || `${tenantId}-users`)
                try {
                  const res = await fetch(`${apiConfig.url}/api/keycloak/groups/${targetGroup}/members/${u.email}`, { method: 'POST' })
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({ detail: res.statusText }))
                    throw new Error(err.detail || res.statusText)
                  }
                  // Force a reload of the UI
                  window.location.reload()
                } catch (e: any) {
                  console.error(e)
                  alert(`Failed to grant access: ${e.message}`)
                }
              }
            }
            setShowInvite(false)
          }}
          existingEmails={users.map(u => u.email)}
          managerTenants={user.role !== 'admin' ? tenants.filter(t => Object.keys(me?.tenant_access || {}).includes(t.id)) : null}
        />
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          placeholder={t('access.filterPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15 transition-all"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[t('access.header.user'), t('access.header.role'), t('access.header.manager'), t('access.header.status'), t('access.header.grantedBy'), ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <UserRow
                  key={u.email}
                  user={u}
                  isAdmin={user.role === 'admin'}
                  ROLE_OPTIONS={ROLE_OPTIONS}
                  onRoleChange={async (r) => {
                    await setRole(u.email, r)
                    if (user.role === 'admin') {
                      for (const t of tenants) {
                        const m = t.manifest as any
                        const adminG = m?.access?.groups?.admins || `${t.id}-admins`
                        const userG = m?.access?.groups?.users || `${t.id}-users`
                        try {
                          if (r === 'manager') {
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${userG}/members/${u.email}`, { method: 'DELETE' })
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${adminG}/members/${u.email}`, { method: 'POST' })
                          } else if (r === 'developer') {
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${adminG}/members/${u.email}`, { method: 'DELETE' })
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${userG}/members/${u.email}`, { method: 'POST' })
                          } else if (r === 'user') {
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${adminG}/members/${u.email}`, { method: 'DELETE' })
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${userG}/members/${u.email}`, { method: 'DELETE' })
                          }
                        } catch(e) {}
                      }
                      window.location.reload()
                    }
                  }}
                  onManagerChange={async (v) => {
                    if (user.role === 'admin') {
                      await setCanManage(u.email, v)
                      for (const t of tenants) {
                        const m = t.manifest as any
                        const adminG = m?.access?.groups?.admins || `${t.id}-admins`
                        const userG = m?.access?.groups?.users || `${t.id}-users`
                        try {
                          if (v) {
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${userG}/members/${u.email}`, { method: 'DELETE' })
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${adminG}/members/${u.email}`, { method: 'POST' })
                          } else {
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${adminG}/members/${u.email}`, { method: 'DELETE' })
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${userG}/members/${u.email}`, { method: 'POST' })
                          }
                        } catch(e) {}
                      }
                      window.location.reload()
                    } else {
                      // Manager changing role (Tenant Admin <-> Tenant Developer)
                      for (const t of tenants.filter(t => Object.keys(me?.tenant_access || {}).includes(t.id))) {
                        const m = t.manifest as any
                        const adminG = m?.access?.groups?.admins || `${t.id}-admins`
                        const userG = m?.access?.groups?.users || `${t.id}-users`
                        try {
                          if (v) {
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${userG}/members/${u.email}`, { method: 'DELETE' })
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${adminG}/members/${u.email}`, { method: 'POST' })
                          } else {
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${adminG}/members/${u.email}`, { method: 'DELETE' })
                            await fetch(`${apiConfig.url}/api/keycloak/groups/${userG}/members/${u.email}`, { method: 'POST' })
                          }
                        } catch(e) {}
                      }
                      window.location.reload()
                    }
                  }}
                  onEnabledChange={(v) => setEnabled(u.email, v)}
                  onRevoke={async () => {
                    if (user.role === 'admin') {
                      await revoke(u.email)
                      window.location.reload()
                    } else {
                      for (const t of tenants.filter(t => Object.keys(me?.tenant_access || {}).includes(t.id))) {
                        const m = t.manifest as any
                        const adminG = m?.access?.groups?.admins || `${t.id}-admins`
                        const userG = m?.access?.groups?.users || `${t.id}-users`
                        try {
                          await fetch(`${apiConfig.url}/api/keycloak/groups/${adminG}/members/${u.email}`, { method: 'DELETE' })
                          await fetch(`${apiConfig.url}/api/keycloak/groups/${userG}/members/${u.email}`, { method: 'DELETE' })
                        } catch(e) {}
                      }
                      window.location.reload()
                    }
                  }}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t('access.noUsers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

/* ─── Single user row ────────────────────────────────────────────── */
function UserRow({ user, isAdmin, ROLE_OPTIONS, onRoleChange, onManagerChange, onEnabledChange, onRevoke }: {
  user: PlatformUser
  isAdmin: boolean
  ROLE_OPTIONS: any[]
  onRoleChange: (r: Role) => void
  onManagerChange: (v: boolean) => void
  onEnabledChange: (v: boolean) => void
  onRevoke: () => void
}) {
  const { t, locale } = useT()
  const [open, setOpen] = useState(false)
  const initials = user.name.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <tr className="tr-hover">
      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0078D4] to-[#106EBE] text-[11px] font-bold text-white shadow-sm">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
            <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Mail size={9} /> {user.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        {isAdmin ? (
          <select
            value={user.role}
            onChange={e => onRoleChange(e.target.value as Role)}
            className="rounded-md border px-2 py-1 text-xs font-medium"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        ) : (
          <Badge variant="gray" size="sm" className="capitalize">{t(`role.${user.role}` as any) || user.role}</Badge>
        )}
      </td>

      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          disabled={!isAdmin}
          onClick={() => onManagerChange(!user.canManageProjects)}
          className={cn(
            'relative inline-flex h-5 w-9 rounded-full transition-colors',
            user.canManageProjects ? 'bg-[#0078D4]' : 'bg-gray-300 dark:bg-gray-600',
            !isAdmin && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Project manager toggle"
        >
          <span className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            user.canManageProjects ? 'translate-x-[18px]' : 'translate-x-0.5'
          )} />
        </button>
      </td>

      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        {user.enabled
          ? <Badge variant="success" dot size="sm">{t('settings.active')}</Badge>
          : <Badge variant="default" size="sm">{t('access.disabled')}</Badge>}
      </td>

      <td className="px-4 py-3 text-xs" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        {user.grantedBy === 'system' ? '—' : user.grantedBy.split('@')[0]}
      </td>

      <td className="px-4 py-3 relative" style={{ borderBottom: '1px solid var(--border)' }}>
        {isAdmin && (
          <>
            <button
              onClick={() => setOpen(o => !o)}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
            >
              <MoreHorizontal size={14} />
            </button>
            {open && (
              <div className="absolute right-2 top-10 z-30 w-44 rounded-lg border bg-white dark:bg-[#1E1E1E] shadow-xl py-1"
                   style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => { onEnabledChange(!user.enabled); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-white/5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {user.enabled ? t('access.disable') : t('access.enable')}
                </button>
                <button
                  onClick={() => { onRevoke(); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  {t('access.revoke')}
                </button>
              </div>
            )}
          </>
        )}
      </td>
    </tr>
  )
}

/* ─── Invite (grant access) ──────────────────────────────────────── */
function InviteCard({ ROLE_OPTIONS, onCancel, onGrant, existingEmails, managerTenants }: {
  ROLE_OPTIONS: any[]
  onCancel: () => void
  onGrant: (u: Omit<PlatformUser, 'grantedAt'>, tenantId?: string) => void
  existingEmails: string[]
  managerTenants: any[] | null
}) {
  const { user } = useAuth()
  const { t, locale } = useT()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('developer')
  const [canManageProjects, setCanManageProjects] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<string>(managerTenants && managerTenants.length > 0 ? managerTenants[0].id : '')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    setError(null)
    if (!email.includes('@')) return setError(t('access.emailRequired'))
    if (!name.trim()) return setError(t('access.nameRequired'))
    if (user?.role !== 'admin' && !selectedTenant) return setError(t('access.tenantRequired'))

    onGrant({
      email: email.trim(),
      name: name.trim(),
      role,
      canManageProjects,
      enabled: true,
      grantedBy: user!.email,
    }, user?.role !== 'admin' ? selectedTenant : undefined)
  }

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus size={16} className="text-[#0078D4]" />
            {t('access.grant.title')}
          </CardTitle>
          <CardDescription>
            {t('access.grant.desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('access.grant.email')}</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@stackr.com"
                className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('access.grant.name')}</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Marie Dupont"
                className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

            <div>
              <p className="mb-2 text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('access.grant.role')}</p>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.filter(o => user?.role === 'admin' || o.value !== 'admin').map(opt => {
                  const I = opt.icon
                  const active = role === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setRole(opt.value)}
                      className={cn(
                        'flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 transition-all text-left',
                        active ? 'border-[#0078D4] bg-[#0078D4]/5' : 'hover:border-[#0078D4]/40'
                      )}
                      style={{ background: active ? undefined : 'var(--bg-card)', borderColor: active ? '#0078D4' : 'var(--border)' }}
                    >
                      <I size={14} className={opt.color} strokeWidth={2.2} />
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {managerTenants && managerTenants.length > 0 && (
              <div>
                <p className="mb-2 text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('access.grant.addToTenant')}</p>
                <select
                  value={selectedTenant}
                  onChange={e => setSelectedTenant(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[#0078D4]"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  {managerTenants.map(t => <option key={t.id} value={t.id}>{t.displayName}</option>)}
                </select>
              </div>
            )}

          {(user?.role === 'admin' || (managerTenants && managerTenants.length > 0)) && (
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:border-[#0078D4]/40 transition-colors"
                   style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <input
                type="checkbox"
                checked={canManageProjects}
                onChange={e => setCanManageProjects(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0078D4] focus:ring-1 focus:ring-[#0078D4]/30"
              />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.role === 'admin' ? t('access.header.manager') : t('access.tenantAdmins')}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {user?.role === 'admin' 
                    ? t('access.grant.roleManagerDescAdmin')
                    : t('access.grant.roleManagerDescManager')}
                </p>
              </div>
            </label>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-[12px] text-rose-700 dark:text-rose-400">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="md" onClick={onCancel}>{t('common.cancel')}</Button>
            <Button variant="primary" size="md" onClick={submit}>
              <CheckCircle2 size={13} /> {t('access.grantAccess')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
