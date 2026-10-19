'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell, Settings, Search, Grid3X3, Users, CheckSquare, X, Sun, Moon, Monitor,
  LayoutDashboard, Building2, Boxes, Rocket, GitBranch, Workflow, Activity, ShieldCheck,
  Languages, FolderGit2, UserPlus, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo, LogoMark } from '@/components/brand/Logo'
import { UserAvatar } from '@/components/avatar/UserAvatar'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/i18n/i18n-context'
import { LOCALES } from '@/lib/i18n/translations'
import { IncidentModal } from '@/components/ui/IncidentModal'
import { formatRelativeTime } from '@/lib/utils'
import { useNotifications } from '@/lib/notifications-store'
import { useTenants } from '@/lib/tenants-store'
import { useServices } from '@/lib/services-store'
import { useMe, filterVisibleTenants } from '@/lib/me-store'
import { apiConfig } from '@/lib/config'

/* ─── Navigation structure ─────────────────────────────────────── */
import type { TranslationKey } from '@/lib/i18n/translations'

const NAV_SECTIONS: { labelEn: string; labelFr: string; items: { tkey: TranslationKey; href: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    labelEn: 'Overview', labelFr: 'Vue d\'ensemble',
    items: [
      { tkey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    labelEn: 'Platform', labelFr: 'Plateforme',
    items: [
      { tkey: 'nav.tenants',     href: '/tenants',     icon: Building2 },
      { tkey: 'nav.services',    href: '/services',    icon: Boxes },
    ],
  },
  {
    labelEn: 'Engineering', labelFr: 'Ingénierie',
    items: [
      { tkey: 'nav.gitops',  href: '/gitops',  icon: GitBranch },
      { tkey: 'nav.cicd',    href: '/cicd',    icon: Workflow },
    ],
  },
  {
    labelEn: 'Operations', labelFr: 'Opérations',
    items: [
      { tkey: 'nav.monitoring', href: '/observability', icon: Activity },
      { tkey: 'nav.security',   href: '/security',      icon: ShieldCheck },
    ],
  },
  {
    labelEn: 'Administration', labelFr: 'Administration',
    items: [
      { tkey: 'nav.admin',    href: '/admin',         icon: Users },
      { tkey: 'nav.users',    href: '/admin/access',  icon: UserPlus },
      { tkey: 'nav.ticketing', href: '/ticketing',    icon: CheckSquare },
      { tkey: 'nav.settings', href: '/settings',      icon: Settings },
    ],
  },
]

/* ─── Theme toggle logic ────────────────────────────────────────────── */
type Theme = 'light' | 'dark' | 'system'

function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as Theme | null
    setTheme(stored ?? 'system')
  }, [])

  const apply = (t: Theme) => {
    setTheme(t)
    if (t === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', t)
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  return { theme, apply, mounted }
}

/* ─── Dropdown wrapper ──────────────────────────────────────────────── */
function Dropdown({ trigger, children, align = 'right' }: {
  trigger: React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  const close = () => setOpen(false)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative h-full flex items-center">
      <div onClick={() => setOpen(o => !o)} className="h-full flex items-center cursor-pointer">{trigger}</div>
      {open && (
        <div className={cn(
          'absolute top-[calc(100%+4px)] z-50 min-w-[220px] rounded-md overflow-hidden',
          'bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 shadow-xl animate-fade-in',
          align === 'right' ? 'right-0' : 'left-0'
        )}>
          {children(close)}
        </div>
      )}
    </div>
  )
}

/* ─── Main Header ───────────────────────────────────────────────────── */
/* ─── Animated 9-dot launcher icon ─── */
function LauncherIcon() {
  return (
    <div className="grid grid-cols-3 gap-[3px] transition-transform duration-500 group-hover:rotate-90 group-active:scale-90">
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="launcher-dot block h-[4px] w-[4px] rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.35)]"
        />
      ))}
    </div>
  )
}

export function Header() {
  const { theme, apply, mounted } = useTheme()
  const [query, setQuery] = useState('')
  const pathname = usePathname()
  const { user } = useAuth()
  const { locale, setLocale, t } = useT()
  const [isIncidentOpen, setIsIncidentOpen] = useState(false)
  const { notifications, markAllAsRead, addNotification } = useNotifications()

  const { me } = useMe()
  const { tenants } = useTenants()
  const { services, fetchServices, loaded: servicesLoaded } = useServices()

  useEffect(() => {
    if (!user) return

    const fetchUserNotifications = async () => {
      try {
        const ticketsRes = await fetch(`${apiConfig.url}/api/tickets`)
        if (ticketsRes.ok) {
          const tickets = await ticketsRes.json()
          tickets.forEach((t: any) => {
            if (user.role === 'admin' && (t.status === 'open' || t.status === 'in_progress')) {
              addNotification({
                id: `ticket-${t.id}`,
                message: `New Incident: ${t.title} (reported by ${t.reported_by})`,
                severity: 'error',
                timestamp: t.created_at
              })
            }
            if (t.reported_by === user.email && t.status === 'resolved') {
              addNotification({
                id: `ticket-resolved-${t.id}`,
                message: `Incident Resolved: "${t.title}". Comment: ${t.resolution_message || 'No comment'}`,
                severity: 'success',
                timestamp: t.created_at
              })
            }
          })
        }
      } catch (err) {
      }
    }

    fetchUserNotifications()
    const interval = setInterval(fetchUserNotifications, 10000)
    return () => clearInterval(interval)
  }, [user, addNotification])

  useEffect(() => {
    if (me && !servicesLoaded) {
      const namespaces = me.is_super_admin ? ['all'] : Object.keys(me.tenant_access || {}).map(tid => `${tid}-ns`)
      if (namespaces.length > 0 || me.is_super_admin) {
        fetchServices(namespaces)
      }
    }
  }, [me, servicesLoaded, fetchServices])

  const visibleTenants = filterVisibleTenants(me, tenants)

  const matchingTenants = query.trim()
    ? visibleTenants.filter(t => 
        t.displayName.toLowerCase().includes(query.toLowerCase()) || 
        t.id.toLowerCase().includes(query.toLowerCase()) ||
        t.namespace.toLowerCase().includes(query.toLowerCase())
      )
    : []

  const matchingServices = query.trim()
    ? services.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase()) || 
        s.category.toLowerCase().includes(query.toLowerCase()) ||
        s.description.toLowerCase().includes(query.toLowerCase())
      )
    : []

  return (
    <header
      className="sticky top-0 z-40 flex h-12 items-center text-white w-full shrink-0"
      style={{ background: '#1C1C1C', borderBottom: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 1px 8px rgba(0,0,0,0.45)' }}
    >

      {/* ── App launcher ── */}
      <Dropdown align="left" trigger={
        <button className="launcher-btn group relative h-12 w-12 shrink-0 flex items-center justify-center hover:bg-white/10 transition-colors duration-300 overflow-hidden">
          {/* Animated radial sheen */}
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Animated rotating border ring on hover */}
          <span className="absolute inset-1 rounded-md border border-white/0 group-hover:border-white/20 transition-all duration-300" />
          <LauncherIcon />
        </button>
      }>
        {(close) => (
          <div className="w-[280px] max-h-[80vh] overflow-y-auto bg-white dark:bg-[#1C2033] text-gray-900 dark:text-gray-100 shadow-2xl flex flex-col" onClick={close}>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2D3148]">
              <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">App Launcher</p>
            </div>
            <div className="p-2 space-y-4">
              {NAV_SECTIONS
                .map(s => ({
                  ...s,
                  items: s.items.filter(it => {
                    if (!user) return true
                    const adminOnly = ['/admin']
                    const managerAndAdmin = ['/admin/access']
                    if (user.role !== 'admin' && adminOnly.includes(it.href)) return false
                    if (user.role !== 'admin' && user.role !== 'manager' && managerAndAdmin.includes(it.href)) return false
                    return true
                  }),
                }))
                .filter(s => s.items.length > 0)
                .map((section) => (
                <div key={section.labelEn}>
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                    {locale === 'fr' ? section.labelFr : section.labelEn}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map(item => {
                      const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors',
                            isActive
                              ? 'bg-[#0078D4]/10 text-[#0078D4]'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/05'
                          )}
                        >
                          <item.icon size={15} strokeWidth={2} className={cn(isActive ? 'text-[#0078D4]' : 'text-gray-400 dark:text-gray-500')} />
                          {t(item.tkey)}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dropdown>

      {/* ── Brand: stackr logo only (clean Outlook-style) ── */}
      <div className="flex items-center gap-3">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <Logo size="lg" variant="white" className="font-bold tracking-tight opacity-95" />
          </div>
        </Link>
      </div>

      {/* ── Search ── */}
      <div className="flex-1 flex items-center justify-center px-6 relative">
        <div className="relative w-full max-w-[480px]">
          <div className="flex items-center h-[30px] bg-white rounded-[4px] overflow-hidden shadow-sm">
            <Search size={14} className="ml-2.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('common.search')}
              className="flex-1 h-full bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400 px-2 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="pr-2 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>
          
          {query && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-[#1E1E1E] rounded-md border border-gray-200 dark:border-gray-800 shadow-xl z-50 animate-fade-in overflow-hidden">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                {locale === 'fr' ? `Résultats de recherche pour "${query}"` : `Search Results for "${query}"`}
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {matchingTenants.length === 0 && matchingServices.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[12px] text-gray-500">
                    {locale === 'fr' ? 'Aucun résultat trouvé' : 'No results found'}
                  </div>
                ) : (
                  <>
                    {matchingTenants.map(t => (
                      <Link
                        key={t.id}
                        href="/tenants"
                        onClick={() => setQuery('')}
                        className="flex items-center gap-3 px-3 py-2.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="w-6 h-6 rounded bg-[#0078D4]/10 text-[#0078D4] flex items-center justify-center shrink-0">
                          <Building2 size={12} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block font-medium truncate">{t.displayName}</span>
                          <span className="block text-[10px] text-gray-500 truncate">{t.namespace} ({t.envType})</span>
                        </div>
                      </Link>
                    ))}
                    {matchingServices.map(s => (
                      <Link
                        key={s.id}
                        href="/services"
                        onClick={() => setQuery('')}
                        className="flex items-center gap-3 px-3 py-2.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                          <Boxes size={12} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block font-medium truncate">{s.name}</span>
                          <span className="block text-[10px] text-gray-500 truncate">{s.category} · {s.namespace}</span>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right icons ── */}
      <div className="flex items-center h-full shrink-0 pr-4 gap-1.5">

        {user && user.role !== 'user' && user.role !== 'admin' && (
          <>
            <button 
              onClick={() => setIsIncidentOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-md bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
              title="Report Incident"
            >
              <AlertCircle size={14} strokeWidth={2.5} />
              <span className="text-[11px] font-bold uppercase tracking-wider hidden md:inline">{t('common.reportIncident') || 'Report Incident'}</span>
            </button>
            <IncidentModal isOpen={isIncidentOpen} onClose={() => setIsIncidentOpen(false)} />
          </>
        )}

        <Link href="/admin/access" className="header-icon-btn flex items-center justify-center" title="People">
          <Users size={17} strokeWidth={1.5} />
        </Link>

        {/* Language switcher */}
        <Dropdown align="right" trigger={
          <button className="header-icon-btn flex items-center gap-1" title="Language">
            <Languages size={16} strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase">{locale}</span>
          </button>
        }>
          {(close) => (
            <div className="p-1.5 text-gray-900 dark:text-gray-100">
              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {t('settings.language')}
              </p>
              {LOCALES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLocale(l.code); close(); }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-2 py-2 text-[12px] rounded-md transition-colors',
                    locale === l.code
                      ? 'bg-[#0078D4]/10 text-[#0078D4] font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/05'
                  )}
                >
                  <span className="text-base font-bold leading-none">{l.flag}</span>
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </Dropdown>

        <Dropdown align="right" trigger={
          <button className="relative header-icon-btn" title="Notifications" onClick={() => markAllAsRead()}>
            <Bell size={17} strokeWidth={1.5} />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-[1.5px] ring-[#1C1C1C]" />
            )}
          </button>
        }>
          {(close) => (
            <div className="w-[320px] text-gray-900 dark:text-gray-100 flex flex-col max-h-[400px]">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2D3148] flex justify-between items-center shrink-0">
                <p className="text-[13px] font-semibold">Notifications</p>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    {notifications.filter(n => !n.read).length} new
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-[12px] text-gray-500">No notifications</div>
                  ) : (
                    notifications.map(ev => (
                      <div key={ev.id} className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={close}>
                        <div className="flex gap-2.5">
                          <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', {
                            'bg-emerald-500': ev.severity === 'success',
                            'bg-amber-500': ev.severity === 'warning',
                            'bg-rose-500': ev.severity === 'error',
                            'bg-blue-500': ev.severity === 'info',
                          })} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] text-gray-900 dark:text-gray-100 leading-tight mb-1">{ev.message}</p>
                            <p className="text-[10px] text-gray-500">{formatRelativeTime(ev.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </Dropdown>

        {mounted && (
          <Dropdown align="right" trigger={
            <button className="header-icon-btn" title="Appearance & Settings">
              <Monitor size={17} strokeWidth={1.5} />
            </button>
          }>
            {(close) => (
              <div className="p-2 text-gray-900 dark:text-gray-100">
                <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Appearance</p>
                {([
                  { v: 'light',  icon: Sun,     label: 'Light mode' },
                  { v: 'dark',   icon: Moon,    label: 'Dark mode'  },
                  { v: 'system', icon: Monitor, label: 'Use system' },
                ] as const).map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => { apply(opt.v); close(); }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-2 py-2 text-[12px] rounded-md transition-colors',
                      theme === opt.v
                        ? 'bg-[#0078D4]/10 text-[#0078D4] font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/05'
                    )}
                  >
                    <opt.icon size={13} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </Dropdown>
        )}

        {/* User info & avatar */}
        <div className="flex items-center gap-3 px-3 ml-2 h-8">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-[11px] font-semibold text-white/90">{user?.name || 'Guest'}</span>
            <span className="text-[9px] text-white/50 font-medium uppercase tracking-wider">{user?.role || 'Viewer'}</span>
          </div>
          <UserAvatar />
        </div>
      </div>
    </header>
  )
}
