'use client'

import { useState, useEffect } from 'react'
import {
  GitBranch, GitCommit, RefreshCw, CheckCircle2, AlertCircle,
  ArrowUpRight, Clock, Package, Activity,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ServiceIcon } from '@/components/icons/ServiceIcon'

import { useGitOps } from '@/lib/gitops-store'
import { useMe, filterVisibleTenants } from '@/lib/me-store'
import { useTenants } from '@/lib/tenants-store'
import { useAuth } from '@/lib/auth-context'
import { formatRelativeTime } from '@/lib/utils'
import { useT } from '@/lib/i18n/i18n-context'

const HELM = [
  { name: 'gitlab',                   chart: 'gitlab/gitlab',                     version: '8.4.2',  ns: 'devops-platform', sid: 'gitlab'    },
  { name: 'jenkins',                  chart: 'jenkins/jenkins',                   version: '5.7.0',  ns: 'devops-platform', sid: 'jenkins'   },
  { name: 'nexus-repository-manager', chart: 'sonatype/nexus-repository-manager', version: '64.2.0', ns: 'devops-platform', sid: 'nexus'     },
  { name: 'sonarqube',                chart: 'sonarqube/sonarqube',               version: '10.7.0', ns: 'devops-platform', sid: 'sonarqube' },
]

export default function GitOpsPage() {
  const { t } = useT()
  const { apps, commits, loaded, fetchApps, fetchCommits, syncApp } = useGitOps()
  const { tenants, loaded: tenantsLoaded } = useTenants()
  const { me } = useMe()
  const { user } = useAuth()
  const [syncing, setSyncing] = useState<string | null>(null)
  
  useEffect(() => {
    fetchApps()
    fetchCommits()
  }, [fetchApps, fetchCommits])

  // Get tenants this user has access to
  const myTenants = filterVisibleTenants(me, tenants)
  const myTenantIds = myTenants.map(t => t.id.toLowerCase())
  const myTenantNamespaces = myTenants.map(t => t.namespace.toLowerCase())

  // Filter Argo CD apps based on user role and tenants
  const visibleApps = apps.filter(app => {
    if (user?.role === 'admin') return true
    const ns = app.namespace?.toLowerCase() || ''
    const name = app.name?.toLowerCase() || ''
    return myTenants.some(t => {
      const tNs = t.namespace?.toLowerCase() || ''
      const tId = t.id?.toLowerCase() || ''
      return ns === tNs || name.includes(tId)
    })
  })

  // Filter commits based on user role and tenants
  const visibleCommits = commits.filter(c => {
    if (user?.role === 'admin') return true
    const msg = c.msg.toLowerCase()
    return myTenantIds.some(tid => msg.includes(tid))
  })
  
  const synced = visibleApps.filter(a => a.status === 'Synced' || a.status === 'Unknown').length
  const pct = visibleApps.length > 0 ? Math.round((synced / visibleApps.length) * 100) : 100

  const triggerSync = (n: string) => { 
    setSyncing(n)
    setTimeout(() => {
      syncApp(n)
      setSyncing(null)
    }, 1800)
  }

  // Calculate last sync time
  const lastSyncTime = visibleApps.length > 0
    ? formatRelativeTime(new Date(Math.max(...visibleApps.map(a => new Date(a.lastSync).getTime()))))
    : 'no syncs yet'

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">{t('gitops.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">{t('gitops.subtitle')}</p>
        </div>
        <Badge variant="brand">
          <GitBranch size={11} />
          main · <span className="font-mono">{visibleCommits[0]?.id || 'a3f9c2d'}</span>
        </Badge>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: t('gitops.syncRate'),     value: `${pct}%`, sub: visibleApps.length > 0 ? `${synced}/${visibleApps.length} ${t('gitops.apps')}` : t('gitops.noAppsLabel'), icon: CheckCircle2, color: 'text-success-600', bg: 'bg-success-50'  },
          { label: t('gitops.helmReleases'), value: '4',       sub: t('gitops.allDeployed'),                         icon: Package,      color: 'text-purple-600',  bg: 'bg-purple-50'   },
          { label: t('gitops.totalCommits'), value: `${visibleCommits.length}`,     sub: t('gitops.latestChanges'),             icon: GitCommit,    color: 'text-brand-navy',  bg: 'bg-brand-navy/8'},
          { label: t('gitops.lastSync'),     value: lastSyncTime,  sub: t('gitops.activeEnvs'),                     icon: Activity,     color: 'text-brand-teal-dark', bg: 'bg-brand-teal-light' },
        ].map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-200 p-5 shadow-xs">
              <div className="flex items-start justify-between mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
                  <Icon size={17} className={c.color} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-500">{c.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">{c.value}</p>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">{c.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Argo CD + commits */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Argo CD apps */}
        <div>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">{t('gitops.argoApps')}</h2>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">{t('gitops.cdStatus')}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <Progress value={pct} className="w-24" />
              <span className="text-xs font-bold text-gray-600 dark:text-slate-400">{pct}%</span>
            </div>
          </div>
          <Card>
            <div className="divide-y divide-gray-200 dark:divide-dark-border">
              {visibleApps.map(app => (
                <div key={app.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors group">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-[11px] font-bold text-white uppercase">
                    {app.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{app.name}</p>
                    <p className="font-mono text-[11px] text-gray-500 dark:text-slate-500">{app.namespace}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={app.status === 'Synced' || app.status === 'Unknown' ? 'success' : 'warning'} dot size="sm">{app.status}</Badge>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{new Date(app.lastSync).toLocaleTimeString()}</span>
                  </div>
                  <button
                    onClick={() => triggerSync(app.id)}
                    disabled={syncing === app.id}
                    title={t('gitops.triggerPipeline')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-200 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dark-300 hover:text-gray-900 dark:text-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <RefreshCw size={13} className={syncing === app.id ? 'animate-spin text-brand-teal' : ''} />
                  </button>
                </div>
              ))}
              {visibleApps.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500">
                  {t('gitops.noApps')}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Commits */}
        <div>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">{t('gitops.recentCommits')}</h2>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">{t('gitops.fromRepo')}</p>
            </div>
            <Badge variant="default">
              <GitBranch size={11} className="text-brand-teal" />
              main
            </Badge>
          </div>
          <Card>
            <div className="divide-y divide-gray-200 dark:divide-dark-border">
              {visibleCommits.map(c => (
                <div key={c.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors">
                  <GitCommit size={14} className="mt-0.5 shrink-0 text-gray-400 dark:text-slate-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-900 dark:text-slate-100 leading-snug font-medium">{c.msg}</p>
                    <div className="mt-1 flex items-center gap-2.5 text-[11px] text-gray-500 dark:text-slate-500">
                      <span className="font-mono font-semibold text-brand-teal-dark">{c.id}</span>
                      <span>·</span>
                      <span>{c.author}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(c.ago)}</span>
                    </div>
                  </div>
                  <CheckCircle2 size={13} className="mt-1 shrink-0 text-success-500" strokeWidth={2.5} />
                </div>
              ))}
              {visibleCommits.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500">
                  {t('gitops.noCommits')}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Helm releases */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">{t('gitops.helmReleases')}</h2>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">{t('gitops.helmSubtitle')}</p>
        </div>
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-border">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{t('gitops.release')}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{t('gitops.chart')}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{t('gitops.namespace')}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{t('gitops.version')}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{t('gitops.status')}</th>
                <th className="w-12 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {HELM.map(r => (
                <tr key={r.name} className="tr-hover group transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <ServiceIcon service={r.sid} size={15} containerSize="w-8 h-8" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5"><span className="font-mono text-xs text-gray-600 dark:text-slate-400">{r.chart}</span></td>
                  <td className="px-3 py-3.5"><span className="font-mono text-xs text-gray-600 dark:text-slate-400">{r.ns}</span></td>
                  <td className="px-3 py-3.5"><Badge variant="teal" size="sm" className="font-mono">v{r.version}</Badge></td>
                  <td className="px-3 py-3.5"><Badge variant="success" dot size="sm">{t('gitops.deployed')}</Badge></td>
                  <td className="px-3 py-3.5">
                    <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-dark-300 opacity-0 group-hover:opacity-100 transition-all">
                      <ArrowUpRight size={13} />
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
