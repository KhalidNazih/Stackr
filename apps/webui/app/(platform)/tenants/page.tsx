'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus, Search, MoreHorizontal, CircleDot, Building2, ChevronDown,
  Filter, Download, Users as UsersIcon, AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ServiceIcon } from '@/components/icons/ServiceIcon'
import { useTenants } from '@/lib/tenants-store'
import { useMe, filterVisibleTenants } from '@/lib/me-store'
import { useAuth } from '@/lib/auth-context'
import { usePlatformUsers } from '@/lib/platform-users-store'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/i18n-context'
import type { TranslationKey } from '@/lib/i18n/translations'

type EnvFilter = 'all' | 'production' | 'staging' | 'dev'

export default function TenantsPage() {
  const { t } = useT()
  const { me } = useMe()
  const { user } = useAuth()
  const { users } = usePlatformUsers()
  const { tenants: allTenants, loaded, error } = useTenants()
  const [query, setQuery] = useState('')
  const [envFilter, setEnvFilter] = useState<EnvFilter>('all')

  // Role-based tenant filtering
  const tenants = filterVisibleTenants(me, allTenants)

  const filtered = useMemo(() => {
    return tenants.filter(t => {
      if (envFilter !== 'all' && t.envType !== envFilter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        return t.displayName.toLowerCase().includes(q)
          || t.namespace.toLowerCase().includes(q)
          || t.owner.toLowerCase().includes(q)
          || t.businessUnit.toLowerCase().includes(q)
      }
      return true
    })
  }, [tenants, query, envFilter])

  const counts = {
    all: tenants.length,
    production:  tenants.filter(t => t.envType === 'production').length,
    staging:     tenants.filter(t => t.envType === 'staging').length,
    dev: tenants.filter(t => t.envType === 'dev').length,
  }

  const isManager = me?.can_manage_projects || user?.role === 'manager' || user?.role === 'admin'
  const canCreate = me?.is_super_admin || isManager

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('tenants.title')}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('tenants.subtitle')} ({filtered.length} / {tenants.length}).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="md"><Download size={13} /> {t('common.export')}</Button>
          {canCreate && (
            <Button variant="primary" size="md" asChild>
              <Link href="/tenants/create"><Plus size={13} /> {t('dashboard.newTenant')}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[260px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder={t('tenants.searchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15 transition-all"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {(['all','production','staging','dev'] as EnvFilter[]).map(f => {
            const label = f === 'all' ? t('tenants.envAll') :
                          f === 'production' ? t('tenants.envProd') :
                          f === 'staging' ? t('tenants.envStaging') :
                          t('tenants.envDev');
            return (
              <button
                key={f}
                onClick={() => setEnvFilter(f)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[12px] font-semibold capitalize transition-all flex items-center gap-1.5',
                  envFilter === f
                    ? 'bg-[#0078D4] text-white'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                )}
                style={envFilter !== f ? { color: 'var(--text-secondary)' } : undefined}
              >
                {label}
                <span className={cn('rounded-full px-1.5 text-[10px]', envFilter === f ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10')}>
                  {counts[f]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cards grid */}
      {!loaded ? (
        <Card className="py-16 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#0078D4] border-t-transparent" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
        </Card>
      ) : error ? (
        <Card className="py-16 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-rose-400" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('tenants.loadError')}</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{error}</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {tenants.length === 0 ? t('tenants.noTenants') : t('tenants.noResults')}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {tenants.length === 0 ? t('tenants.noTenantsDesc') : t('tenants.noResultsDesc')}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tenant, i) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/tenants/${tenant.id}`}>
                <Card className="p-5 card-interactive cursor-pointer group h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0078D4] to-[#106EBE] text-[12px] font-bold text-white shadow-md">
                          {tenant.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{tenant.displayName}</p>
                          <p className="text-[11px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>{tenant.namespace}</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant={tenant.envType === 'production' ? 'error' : tenant.envType === 'staging' ? 'warning' : 'info'} size="sm">{tenant.envType}</Badge>
                      <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <CircleDot size={9} className={tenant.status === 'healthy' ? 'text-success-500' : 'text-warning-500'} strokeWidth={2.5} />
                        {tenant.status} · {tenant.pods} {t('tenants.pods')}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('nav.services')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tenant.services.map((s: string) => (
                          <ServiceIcon key={s} service={s} size={11} containerSize="w-6 h-6" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t mt-4" style={{ borderColor: 'var(--border)' }}>
                    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      <UsersIcon size={10} /> {tenant.owner.split('@')[0]}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{tenant.businessUnit}</span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
