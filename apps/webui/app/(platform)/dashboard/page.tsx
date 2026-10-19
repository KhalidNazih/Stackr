'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Layers, Box, Plus, ShieldCheck, CheckCheck, CircleDot,
  MoreHorizontal, ArrowUpRight, Sparkles, ArrowRight,
  CheckCircle2, AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ServiceIcon } from '@/components/icons/ServiceIcon'
import { useTenants } from '@/lib/tenants-store'
import { useNamespacePods } from '@/lib/cluster-store'
import { useMe, filterVisibleTenants } from '@/lib/me-store'
import { useT } from '@/lib/i18n/i18n-context'
import type { TranslationKey } from '@/lib/i18n/translations'

const QUICK_ACTIONS: Array<{ tkey: TranslationKey; descKey: TranslationKey; href: string; icon: typeof Plus }> = [
  { tkey: 'dashboard.newTenant',      descKey: 'dashboard.provisionEnv',   href: '/tenants/create', icon: Plus },
  { tkey: 'dashboard.reviewRequests', descKey: 'dashboard.reviewRequests', href: '/admin',          icon: ShieldCheck },
  { tkey: 'dashboard.gitopsStatus',   descKey: 'dashboard.gitopsStatus',   href: '/gitops',         icon: CheckCheck },
]

function podAppName(podName: string): string {
  // Strip the ReplicaSet hash suffix: "platform-api-5fdd4d67d7-xmmlp" → "platform-api"
  return podName.replace(/-[a-z0-9]{7,10}-[a-z0-9]{5}$/, '').replace(/-[a-z0-9]{5}$/, '')
}

export default function DashboardPage() {
  const { t, locale } = useT()
  const { me, loaded: meLoaded } = useMe()
  const { tenants: allTenants, loaded: tenantsLoaded } = useTenants()

  // Filter tenants based on user's tenant access
  const tenants = filterVisibleTenants(me, allTenants)

  // Decide which namespace to show on the dashboard
  //   • Super admin → 'all' (all pods)
  //   • Tenant user → first tenant's namespace
  //   • Guest       → nothing
  const podsNamespace = me?.is_super_admin
    ? 'all'
    : (tenants.length > 0 ? tenants[0].namespace : null)

  const { pods, loaded: podsLoaded, runningCount } = useNamespacePods(podsNamespace)

  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? 'greeting.morning' : hour < 18 ? 'greeting.afternoon' : 'greeting.evening'
  const isSuperAdmin = me?.is_super_admin ?? false
  const firstName = me?.name?.split(' ')[0] ?? 'there'

  const roleLabel = isSuperAdmin
    ? t('dashboard.roleAdmin')
    : me?.role === 'tenant_user'
      ? t('dashboard.roleTenantUser').replace('{role}', (Object.values(me.tenant_access)[0] ?? 'user') as string)
      : t('dashboard.guest')

  const subline = isSuperAdmin
    ? t('dashboard.todayAdmin')
    : me?.role === 'tenant_user'
      ? t('dashboard.accessCount').replace('{count}', String(Object.keys(me.tenant_access).length))
      : t('dashboard.noAccess')

  return (
    <div className="space-y-7 animate-fade-in">

      {/* ─── Welcome ─── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 mb-2">
            <Sparkles size={12} className="text-[#0078D4]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0078D4]">{roleLabel} {t('dashboard.welcome')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t(greetingKey)}, {firstName}
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>{subline}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="md" asChild>
            <Link href="/tenants/create"><Plus size={14} /> {isSuperAdmin ? t('dashboard.createTenant') : t('dashboard.requestTenant')}</Link>
          </Button>
        </div>
      </div>

      {/* ─── Metrics ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Active tenants — real from GitLab registry */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <div className="relative overflow-hidden rounded-xl border p-5 shadow-xs hover:shadow-md transition-shadow" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm bg-[#0078D4]/10">
                <Layers size={19} className="text-[#0078D4]" strokeWidth={2.2} />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.activeTenants')}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {tenantsLoaded ? tenants.length : '…'}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('dashboard.fromRegistry')}</p>
          </div>
        </motion.div>

        {/* Running pods — real from K8s */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <div className="relative overflow-hidden rounded-xl border p-5 shadow-xs hover:shadow-md transition-shadow" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm bg-[#0078D4]/10">
                <Box size={19} className="text-[#0078D4]" strokeWidth={2.2} />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.runningPods')}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {podsLoaded ? runningCount : '…'}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {podsNamespace ? `${podsNamespace} · ${podsLoaded ? pods.length : '…'} total` : t('dashboard.noAccess')}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── Quick actions ─── */}
      <div className="grid gap-3 md:grid-cols-3">
        {QUICK_ACTIONS.filter(a => {
          if (a.href === '/admin' && !isSuperAdmin) return false
          return true
        }).map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-4 rounded-xl border p-4 shadow-xs transition-all hover:border-[#0078D4] hover:shadow-md"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0078D4]/10 transition-colors group-hover:bg-[#0078D4] group-hover:text-white">
              <a.icon size={20} className="text-[#0078D4] group-hover:text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{t(a.tkey)}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{t(a.descKey)}</p>
            </div>
            <ArrowUpRight size={14} className="text-gray-300 group-hover:text-[#0078D4] transition-colors" />
          </Link>
        ))}
      </div>

      {/* ─── Namespace pods ─── */}
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {isSuperAdmin ? t('dashboard.platformServices') : t('dashboard.myTenantPods')}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {t('dashboard.livePodStatus')} · <span className="font-mono">{podsNamespace === 'all' ? (locale === 'fr' ? 'Tous les espaces' : 'All namespaces') : (podsNamespace ?? '—')}</span>
            </p>
          </div>
          {podsLoaded && (
            <Badge variant={runningCount === pods.length && pods.length > 0 ? 'success' : 'warning'} dot>
              {runningCount}/{pods.length} {t('dashboard.runningCount')}
            </Badge>
          )}
        </div>
        <Card>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Pod', 'Phase', 'Ready', 'Restarts'].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {h === 'Pod' ? 'Pod' : h === 'Phase' ? 'Phase' : h === 'Ready' ? (locale === 'fr' ? 'Prêt' : 'Ready') : (locale === 'fr' ? 'Redémarrages' : 'Restarts')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!podsLoaded && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      <div className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0078D4] border-t-transparent" />
                        {t('dashboard.loadingK8s')}
                      </div>
                    </td>
                  </tr>
                )}
                {podsLoaded && pods.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      {podsNamespace === 'all' ? t('dashboard.noPodsInAll') : t('dashboard.noPodsInNs').replace('{ns}', podsNamespace ?? '')}
                    </td>
                  </tr>
                )}
                {pods.map((pod, i) => (
                  <motion.tr
                    key={pod.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="tr-hover"
                  >
                    <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <p className="text-sm font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{podAppName(pod.name)}</p>
                        <p className="text-[10px] font-mono truncate max-w-[240px]" style={{ color: 'var(--text-muted)' }}>{pod.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-1.5">
                        <CircleDot size={10} className={pod.phase === 'Running' ? 'text-emerald-500' : 'text-amber-500'} strokeWidth={2.5} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{pod.phase}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      {pod.ready
                        ? <CheckCircle2 size={15} className="text-emerald-500" strokeWidth={2.5} />
                        : <AlertCircle size={15} className="text-amber-500" strokeWidth={2.5} />}
                    </td>
                    <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className={`text-sm font-medium ${pod.restarts > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`} style={pod.restarts === 0 ? { color: 'var(--text-secondary)' } : undefined}>
                        {pod.restarts}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ─── Tenants ─── */}
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('dashboard.myTenants')}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('dashboard.tenantsSubtitle')}</p>
          </div>
          <Link href="/tenants" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0078D4] hover:text-[#106EBE] transition-colors">
            {t('common.viewAll')} <ArrowUpRight size={14} />
          </Link>
        </div>
        <Card>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[t('nav.tenants'), t('dashboard.environment'), t('nav.services'), 'Namespace', ''].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!tenantsLoaded && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    <div className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0078D4] border-t-transparent" />
                      {t('dashboard.loadingTenants')}
                    </div>
                  </td>
                </tr>
              )}
              {tenantsLoaded && tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t('dashboard.noTenants')}{' '}
                    <Link href="/tenants/create" className="font-semibold text-[#0078D4] hover:underline">{t('dashboard.createFirst')}</Link>
                  </td>
                </tr>
              )}
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="tr-hover cursor-pointer group">
                  <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white uppercase shadow-sm bg-[#0078D4]">
                        {tenant.displayName.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{tenant.displayName}</p>
                        <p className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{tenant.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <Badge variant={tenant.envType === 'production' ? 'error' : tenant.envType === 'staging' ? 'warning' : 'info'} size="sm">
                      {tenant.envType}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex -space-x-1.5">
                      {tenant.services.map((s: string) => (
                        <div key={s} className="ring-2 ring-white dark:ring-dark-200 rounded-lg">
                          <ServiceIcon service={s} size={11} containerSize="w-6 h-6" />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{tenant.namespace}</span>
                  </td>
                  <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
