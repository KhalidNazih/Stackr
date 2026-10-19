'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Rocket, Search, Clock, Server, GitBranch, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDeployments } from '@/lib/deployments-store'
import { formatRelativeTime } from '@/lib/utils'
import { useT } from '@/lib/i18n/i18n-context'

export default function DeploymentsPage() {
  const { t } = useT()
  const { deployments, loaded, fetchDeployments } = useDeployments()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!loaded) fetchDeployments()
  }, [loaded, fetchDeployments])

  const visible = deployments.filter(d =>
    !query.trim() ||
    d.name.toLowerCase().includes(query.toLowerCase()) ||
    d.destinationNamespace.toLowerCase().includes(query.toLowerCase()) ||
    d.repoURL.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('deployments.title')}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('deployments.subtitle')}
          </p>
        </div>
        <Button variant="primary" size="md">
          <RefreshCw size={14} className="mr-2" /> {t('deployments.syncAll')}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          placeholder={t('deployments.searchPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
        />
      </div>

      <div className="grid gap-3">
        {visible.map((d, i) => (
          <motion.div key={d.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="flex items-center gap-4 p-4 hover:shadow-md transition-shadow">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                d.health === 'Healthy' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                d.health === 'Progressing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
              }`}>
                {d.health === 'Healthy' ? <CheckCircle2 size={16} /> : d.health === 'Progressing' ? <RefreshCw size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
              </div>
              
              <div className="min-w-[140px] flex-1">
                <h3 className="font-semibold text-[13px] text-gray-900 dark:text-gray-100">{d.name}</h3>
                <p className="text-[11px] font-mono mt-0.5 text-gray-500 truncate" title={d.repoURL}>{d.repoURL.split('/').pop()}</p>
              </div>

              <div className="hidden md:flex flex-col flex-1">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5 flex items-center gap-1"><Server size={10} /> {t('deployments.target')}</span>
                <span className="text-[12px] text-gray-900 dark:text-gray-100">{d.destinationNamespace}</span>
              </div>
              
              <div className="hidden xl:flex flex-col flex-1 min-w-[140px]">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5 flex items-center gap-1"><GitBranch size={10} /> {t('deployments.revision')}</span>
                <span className="text-[12px] text-gray-900 dark:text-gray-100 truncate">{d.targetRevision} ({d.path})</span>
              </div>

              <div className="hidden lg:flex flex-col flex-1 min-w-[120px]">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5 flex items-center gap-1"><Clock size={10} /> {t('deployments.lastSync')}</span>
                <span className="text-[12px] text-gray-900 dark:text-gray-100">{d.lastSyncAt ? formatRelativeTime(d.lastSyncAt) : 'Never'}</span>
              </div>

              <div className="w-[120px] flex justify-end gap-2">
                <Badge variant={
                  d.syncStatus === 'Synced' ? 'success' : 
                  d.syncStatus === 'OutOfSync' ? 'warning' : 'default'
                } size="sm" className="capitalize">
                  {d.syncStatus}
                </Badge>
              </div>
            </Card>
          </motion.div>
        ))}
        {visible.length === 0 && (
          <div className="p-12 text-center text-gray-500 border border-dashed rounded-lg dark:border-gray-800">
            {t('deployments.noDeployments')}
          </div>
        )}
      </div>
    </div>
  )
}
