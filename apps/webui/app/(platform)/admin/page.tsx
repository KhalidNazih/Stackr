'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown,
  MoreHorizontal, Calendar, User, Banknote, Layers,
  Activity, Settings, PlayCircle, StopCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ServiceIconInline, SERVICE_META } from '@/components/icons/ServiceIcon'
import { ACTIVITY_EVENTS } from '@/lib/mock-data'
import { formatRelativeTime } from '@/lib/utils'
import { useTenants } from '@/lib/tenants-store'
import { useT } from '@/lib/i18n/i18n-context'

const ACTIVITY_DOT: Record<string, string> = { success: 'bg-success-500', warning: 'bg-warning-500', error: 'bg-error-500', info: 'bg-info-500' }

export default function AdminPage() {
  const { tenants, loaded } = useTenants()
  const [open, setOpen] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'healthy' | 'degraded'>('all')
  const { t, locale } = useT()

  if (!loaded) return null

  const counts = {
    all: tenants.length,
    healthy: tenants.filter(t => t.status === 'healthy').length,
    degraded: tenants.filter(t => t.status === 'degraded').length,
  }

  const filtered = filter === 'all' ? tenants : tenants.filter(t => t.status === filter)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">{t('admin.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">{t('admin.subtitle')}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: t('admin.totalTenants'),  value: counts.all,      icon: Layers,       color: 'text-[#0078D4]',   bg: 'bg-[#0078D4]/10'  },
          { label: t('admin.healthy'),        value: counts.healthy,  icon: CheckCircle2, color: 'text-success-600', bg: 'bg-success-50'    },
          { label: t('admin.degraded'),       value: counts.degraded, icon: AlertTriangle, color: 'text-error-600',   bg: 'bg-error-50'      },
          { label: t('admin.activeServices'),value: tenants.reduce((acc, t) => acc + t.services.length, 0), icon: Settings, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="rounded-xl border p-5 shadow-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
                  <Icon size={17} className={c.color} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{c.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Requests list */}
        <div className="xl:col-span-2 space-y-3">
          {/* Filter */}
          <div className="flex items-center gap-1 rounded-lg border p-1 shadow-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {(['all', 'healthy', 'degraded'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 rounded-md px-3 py-1.5 text-[13px] font-semibold capitalize transition-all flex items-center justify-center gap-1.5 ${
                  filter === f
                    ? 'bg-[#0078D4] text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={filter !== f ? { color: 'var(--text-secondary)' } : undefined}
              >
                {t(`admin.filter.${f}` as any)}
                <span className={`rounded-full px-1.5 py-0 text-[10px] font-bold ${filter === f ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'}`}
                  style={filter !== f ? { color: 'var(--text-muted)' } : undefined}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map(req => {
              const isOpen = open === req.id
              return (
                <motion.div key={req.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <div className={`overflow-hidden rounded-xl border shadow-xs transition-all ${
                    isOpen ? 'border-[#0078D4]/30 shadow-sm' : ''
                  }`} style={{ background: 'var(--bg-card)', borderColor: isOpen ? undefined : 'var(--border)' }}>
                    <button
                      onClick={() => setOpen(isOpen ? null : req.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors text-left"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0078D4] text-[11px] font-bold text-white uppercase">
                        {req.displayName.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{req.displayName}</span>
                          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{req.id}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          <span className="flex items-center gap-1"><User size={10} /> {req.owner}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={req.status === 'healthy' ? 'success' : 'warning'} dot size="sm">
                          {req.status === 'healthy' ? t('admin.healthy') : t('admin.degraded')}
                        </Badge>
                        <ChevronDown size={15} className={`text-gray-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="border-t border-gray-200 dark:border-dark-border px-5 pb-5 pt-4 space-y-4 bg-gray-25 dark:bg-dark-100">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {[
                                { icon: Layers,   label: t('dashboard.environment'), value: req.envType },
                                { icon: Activity, label: t('tenants.pods'),     value: req.pods.toString() },
                                { icon: Layers,   label: t('tenants.services'), value: req.services.length.toString() },
                              ].map(({ icon: Ic, label, value }) => (
                                <div key={label} className="rounded-lg border p-2.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                                  <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                    <Ic size={10} />
                                    <p className="text-[10px] font-semibold uppercase tracking-wide">{label}</p>
                                  </div>
                                  <p className="text-sm font-bold capitalize mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
                                </div>
                              ))}
                            </div>

                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500 mb-2">{t('admin.deployedServices')}</p>
                              <div className="flex flex-wrap gap-2">
                                {req.services.map(s => (
                                  <div key={s} className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-200 px-3 py-1 text-xs font-medium text-gray-700 dark:text-slate-300">
                                    <ServiceIconInline service={s} size={12} />
                                    {SERVICE_META[s]?.name ?? s}
                                  </div>
                                ))}
                                {req.services.length === 0 && (
                                  <p className="text-xs text-gray-500">{t('admin.noServices')}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
            </div>
          </div>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.platformActivity')}</CardTitle>
            <CardDescription>{t('admin.realtimeEvents')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ACTIVITY_EVENTS.slice(0, 7).map(ev => (
                <div key={ev.id} className="flex gap-2.5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ACTIVITY_DOT[ev.severity]}`} />
                  <div className="min-w-0">
                    <p className="text-[13px] text-gray-700 dark:text-slate-300 leading-snug">
                      {t(`activity.event${ev.id}` as any) || ev.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-slate-500">{formatRelativeTime(ev.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
