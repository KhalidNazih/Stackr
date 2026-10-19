'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Workflow, Play, Search, Clock, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCICD } from '@/lib/cicd-store'
import { formatRelativeTime } from '@/lib/utils'
import { useT } from '@/lib/i18n/i18n-context'

export default function CICDPage() {
  const { t } = useT()
  const { pipelines, loaded, fetchPipelines, triggerPipeline } = useCICD()
  const [query, setQuery] = useState('')
  const [triggering, setTriggering] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded) fetchPipelines()
  }, [loaded, fetchPipelines])

  const visible = pipelines.filter(p =>
    !query.trim() ||
    p.project.toLowerCase().includes(query.toLowerCase()) ||
    p.commit.toLowerCase().includes(query.toLowerCase())
  )

  const handleTrigger = (project: string) => {
    setTriggering(project)
    setTimeout(() => {
      triggerPipeline(project)
      setTriggering(null)
    }, 600)
  }

  const statusLabels: Record<string, string> = {
    passed: t('cicd.passed'),
    failed: t('cicd.failed'),
    running: t('cicd.running'),
    unknown: t('cicd.unknown'),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('cicd.title')}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('cicd.subtitle')}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          placeholder={t('cicd.searchPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
        />
      </div>

      <div className="grid gap-4">
        {visible.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
            <Card className="flex items-center gap-4 p-4 hover:shadow-md transition-shadow">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0078D4]/10">
                <Workflow size={18} className="text-[#0078D4]" />
              </div>
              
              <div className="min-w-[150px] flex-1">
                <h3 className="font-semibold text-[13px] text-gray-900 dark:text-gray-100">{p.project}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 rounded">{p.commit}</span>
                </div>
              </div>

              <div className="hidden md:flex flex-col flex-1">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5 flex items-center gap-1"><Clock size={10} /> {t('cicd.duration')}</span>
                <span className="text-[12px] text-gray-900 dark:text-gray-100">{p.duration}</span>
              </div>

              <div className="hidden lg:flex flex-col flex-1">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5 flex items-center gap-1"><Calendar size={10} /> {t('cicd.started')}</span>
                <span className="text-[12px] text-gray-900 dark:text-gray-100">{formatRelativeTime(p.startedAt)}</span>
              </div>

              <div className="w-[100px] flex justify-center">
                <Badge variant={
                  p.status === 'passed' ? 'success' : 
                  p.status === 'failed' ? 'error' : 
                  p.status === 'running' ? 'info' : 'default'
                } dot size="sm" className="capitalize">
                  {statusLabels[p.status] || p.status}
                </Badge>
              </div>

              <div className="pl-4 border-l border-gray-100 dark:border-gray-800">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  title={t('cicd.trigger')}
                  onClick={() => handleTrigger(p.project)}
                  disabled={triggering === p.project}
                >
                  <Play size={13} className={triggering === p.project ? 'animate-pulse' : ''} />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
