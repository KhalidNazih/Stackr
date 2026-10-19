'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Bell, Shield, Palette, Globe, Check, Sparkles, KeyRound,
  Sun, Moon, Monitor, Mail, Save, Lock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth, ROLE_META } from '@/lib/auth-context'
import { AVATAR_ICONS, getAvatarIcon } from '@/components/avatar/avatarIcons'
import { cn } from '@/lib/utils'
import { useMe } from '@/lib/me-store'
import { apiConfig } from '@/lib/config'
import { useT } from '@/lib/i18n/i18n-context'
import type { TranslationKey } from '@/lib/i18n/translations'

type Tab = 'profile' | 'avatar' | 'notifications' | 'security' | 'appearance'

const TABS: { id: Tab; labelKey: TranslationKey; icon: typeof User }[] = [
  { id: 'profile',       labelKey: 'settings.profile',       icon: User      },
  { id: 'avatar',        labelKey: 'settings.avatar',        icon: Sparkles  },
  { id: 'notifications', labelKey: 'settings.notifications', icon: Bell      },
  { id: 'security',      labelKey: 'settings.security',      icon: Shield    },
  { id: 'appearance',    labelKey: 'settings.appearance',    icon: Palette   },
]

export default function SettingsPage() {
  const { t, locale } = useT()
  const { user, setAvatarIcon, hydrated } = useAuth()
  const { me, reload } = useMe()
  const initialTab = (typeof window !== 'undefined' && window.location.hash === '#avatar') ? 'avatar' : 'profile'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [location, setLocation] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (user && !initialized) {
      const savedLocal = localStorage.getItem(`stackr.profile_${user.email}`)
      let localObj: any = {}
      if (savedLocal) {
        try { localObj = JSON.parse(savedLocal) } catch (e) {}
      }
      setName(me?.name || localObj.name || user.name || '')
      setDepartment(me?.department || localObj.department || '')
      setLocation(me?.location || localObj.location || '')
      setInitialized(true)
    } else if (me && initialized) {
      if (me.name && !name) setName(me.name)
      if (me.department && !department) setDepartment(me.department)
      if (me.location && !location) setLocation(me.location)
    }
  }, [me, user, initialized, name, department, location])

  if (!hydrated) return null
  if (!user) return null
  const role = ROLE_META[user.role]
  const current = getAvatarIcon(user.avatarIcon)
  const CurrentIcon = current.icon

  const handleSave = async () => {
    if (user) {
      localStorage.setItem(`stackr.profile_${user.email}`, JSON.stringify({ name, department, location }))
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)

    try {
      const res = await fetch(`${apiConfig.url}/api/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, location }),
        credentials: 'include'
      })
      if (res.ok) {
        await reload()
      }
    } catch (err) {
      console.error('Error saving profile to backend:', err)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('settings.title')}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{t('settings.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* ─── Sidebar tabs ─── */}
        <nav className="space-y-1">
          {TABS.map(tData => {
            const I = tData.icon
            const active = tab === tData.id
            return (
              <button
                key={tData.id}
                onClick={() => setTab(tData.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
                  active
                    ? 'bg-[#0078D4]/10 text-[#0078D4]'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                )}
                style={!active ? { color: 'var(--text-secondary)' } : undefined}
              >
                <I size={14} strokeWidth={2.2} />
                {t(tData.labelKey)}
              </button>
            )
          })}
        </nav>

        {/* ─── Panels ─── */}
        <div className="space-y-5">

          {/* ── PROFILE ── */}
          {tab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.profile')}</CardTitle>
                <CardDescription>{t('settings.profileDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Avatar preview */}
                <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br shadow-lg ring-2 ring-white/20',
                    current.gradient
                  )}>
                    <CurrentIcon size={28} className="text-white drop-shadow-sm" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                    <div className="mt-1.5">
                      <Badge variant="info" dot size="sm">{t(`role.${user.role}` as any) || role.label}</Badge>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setTab('avatar')}>
                    <Sparkles size={12} /> {t('settings.changeAvatar')}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('settings.displayName')}</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15 transition-all"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('settings.email')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ color: 'var(--text-muted)' }}><Mail size={12} /></span>
                      <input
                        value={user.email}
                        disabled
                        className="w-full rounded-lg border py-2.5 text-[13px] outline-none pl-8 pr-3 opacity-60 cursor-not-allowed"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('settings.department')}</label>
                    <input
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15 transition-all"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('settings.location')}</label>
                    <input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15 transition-all"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" size="md">{t('common.cancel')}</Button>
                  <Button variant="primary" size="md" onClick={handleSave}>
                    {saved ? <><Check size={13} /> {t('common.saved')}</> : <><Save size={13} /> {t('common.save')}</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── AVATAR ── */}
          {tab === 'avatar' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.chooseAvatar')}</CardTitle>
                <CardDescription>{t('settings.avatarDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Current preview */}
                <div className="mb-6 flex items-center justify-center rounded-2xl border p-8" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <motion.div
                    key={current.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    className={cn(
                      'flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl ring-4 ring-white/20',
                      current.gradient
                    )}
                  >
                    <CurrentIcon size={44} className="text-white drop-shadow-md" strokeWidth={2.2} />
                  </motion.div>
                </div>

                {/* Grid of options */}
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_ICONS.map(opt => {
                    const I = opt.icon
                    const isActive = opt.id === user.avatarIcon
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setAvatarIcon(opt.id)}
                        className={cn(
                          'group relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all',
                          isActive
                            ? 'border-[#0078D4] shadow-md scale-[1.02]'
                            : 'hover:border-[#0078D4]/40 hover:shadow-sm'
                        )}
                        style={{ background: 'var(--bg-card)', borderColor: isActive ? '#0078D4' : 'var(--border)' }}
                      >
                        {isActive && (
                          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#0078D4] shadow-sm">
                            <Check size={9} className="text-white" strokeWidth={3.5} />
                          </span>
                        )}
                        <div className={cn(
                          'flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br shadow-md transition-transform group-hover:scale-110',
                          opt.gradient
                        )}>
                          <I size={22} className="text-white drop-shadow-sm" strokeWidth={2.2} />
                        </div>
                        <p className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{opt.label}</p>
                      </button>
                    )
                  })}
                </div>

                <p className="mt-5 text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
                  {t('settings.avatarSaveText')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.notifications')}</CardTitle>
                <CardDescription>{t('settings.notifDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {([
                  { labelKey: 'settings.toggle.deployments',   descKey: 'settings.toggle.deploymentsDesc',   def: true  },
                  { labelKey: 'settings.toggle.security',     descKey: 'settings.toggle.securityDesc',     def: true  },
                  { labelKey: 'settings.toggle.provisioning', descKey: 'settings.toggle.provisioningDesc', def: true  },
                  { labelKey: 'settings.toggle.digest',        descKey: 'settings.toggle.digestDesc',        def: false },
                  { labelKey: 'settings.toggle.maintenance',  descKey: 'settings.toggle.maintenanceDesc',  def: true  },
                ] as const).map(item => <Toggle key={item.labelKey} labelKey={item.labelKey} descKey={item.descKey} def={item.def} />)}
              </CardContent>
            </Card>
          )}

          {/* ── SECURITY ── */}
          {tab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.security')}</CardTitle>
                <CardDescription>{t('settings.securityDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Shield size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings.mfaTitle')}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('settings.mfaDesc')}</p>
                    </div>
                  </div>
                  <Badge variant="success" dot size="sm">{t('settings.active')}</Badge>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0078D4]/10">
                      <KeyRound size={16} className="text-[#0078D4]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings.patTitle')}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('settings.patDesc')}</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">{t('settings.manage')}</Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
                      <Lock size={16} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings.sessionsTitle')}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('settings.sessionsDesc')}</p>
                    </div>
                  </div>
                  <Button variant="danger-outline" size="sm">{t('settings.revokeAll')}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── APPEARANCE ── */}
          {tab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.appearance')}</CardTitle>
                <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('settings.themeSubhead')}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: 'light',  icon: Sun,     labelKey: 'settings.light'  },
                    { v: 'dark',   icon: Moon,    labelKey: 'settings.dark'   },
                    { v: 'system', icon: Monitor, labelKey: 'settings.system' },
                  ].map(tOpt => {
                    const I = tOpt.icon
                    return (
                      <button
                        key={tOpt.v}
                        onClick={() => {
                          if (tOpt.v === 'system') localStorage.removeItem('theme')
                          else localStorage.setItem('theme', tOpt.v)
                          const isDark = tOpt.v === 'dark' || (tOpt.v === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                          document.documentElement.classList.toggle('dark', isDark)
                        }}
                        className="flex flex-col items-center gap-2 rounded-xl border p-4 hover:border-[#0078D4]/40 transition-all"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                      >
                        <I size={18} className="text-[#0078D4]" />
                        <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t(tOpt.labelKey as any)}</span>
                      </button>
                    )
                  })}
                </div>

                <p className="mt-6 mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('settings.langSubhead')}</p>
                <div className="flex items-center gap-3 rounded-lg border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <Globe size={16} className="text-[#0078D4]" />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {locale === 'fr' ? t('settings.french') : t('settings.english')}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Toggle({ labelKey, descKey, def }: { labelKey: TranslationKey; descKey: TranslationKey; def: boolean }) {
  const { t } = useT()
  const [on, setOn] = useState(def)
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      <div className="min-w-0 mr-4">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t(labelKey)}</p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t(descKey)}</p>
      </div>
      <button
        onClick={() => setOn(o => !o)}
        className={cn(
          'relative h-5 w-10 shrink-0 rounded-full transition-colors',
          on ? 'bg-[#0078D4]' : 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
          on ? 'translate-x-5' : 'translate-x-0'
        )} />
      </button>
    </div>
  )
}
