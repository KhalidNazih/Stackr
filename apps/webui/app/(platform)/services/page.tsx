'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Boxes, Search, Activity, Box, Shield, ExternalLink, Cpu, Server, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ServiceIcon } from '@/components/icons/ServiceIcon'
import { useServices } from '@/lib/services-store'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useMe, filterVisibleTenants } from '@/lib/me-store'
import { useTenants } from '@/lib/tenants-store'
import { useT } from '@/lib/i18n/i18n-context'
import { keycloakConfig, vaultConfig, argocdConfig, gitlabConfig } from '@/lib/config'
import servicesCatalog from '@/config/services-catalog.json'

export default function ServicesPage() {
  const { t, locale } = useT()
  const { services, pods, loaded, fetchServices } = useServices()
  const { tenants, loaded: tenantsLoaded } = useTenants()
  const { user } = useAuth()
  const { me } = useMe()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (me && tenantsLoaded) {
      let namespaces = ['admin']
      if (me.is_super_admin) {
        namespaces = ['all']
      } else {
        const matchingTenants = filterVisibleTenants(me, tenants)
        namespaces = matchingTenants.length > 0 ? matchingTenants.map(t => t.namespace) : ['default']
      }
      fetchServices(namespaces)
    }
  }, [me, tenantsLoaded, tenants, fetchServices])

  const getServiceUrl = (s: typeof services[0]) => {
    const sLower = s.name.toLowerCase()
    const idLower = s.id.toLowerCase()

    if (idLower.includes('keycloak') || sLower.includes('keycloak')) {
      return keycloakConfig.url || 'http://192.168.253.133:31825'
    }
    if (idLower.includes('openbao') || idLower.includes('vault') || sLower.includes('openbao') || sLower.includes('vault')) {
      return vaultConfig.url || 'http://192.168.253.133:31826'
    }
    if (idLower.includes('argocd') || sLower.includes('argo')) {
      return argocdConfig.url || 'http://192.168.253.133:30080'
    }
    if (idLower.includes('gitlab') || sLower.includes('gitlab')) {
      if (gitlabConfig.url) return gitlabConfig.url
    }

    const tenant = tenants.find(t => t.namespace === s.namespace)
    if (!tenant || !tenant.manifest) return null
    const manifest = tenant.manifest as any

    const matchedCatalog = (servicesCatalog as any[]).find(
      (c: any) =>
        s.name.toLowerCase().includes(c.id.toLowerCase()) ||
        s.name.toLowerCase().includes(c.name.toLowerCase()) ||
        s.id.toLowerCase().includes(c.id.toLowerCase())
    )
    const id = matchedCatalog ? matchedCatalog.id : ''
    if (!id) return null
    
    const svcCfg = manifest.services?.[id]
    if (svcCfg?.node_port) {
      const baseUrl = manifest.platform?.public_base_url || 'http://192.168.253.133'
      const ipMatch = baseUrl.match(/https?:\/\/([^:\/]+)/)
      const ip = ipMatch ? ipMatch[1] : '192.168.253.133'
      return `http://${ip}:${svcCfg.node_port}`
    }
    return null
  }

  const visibleServices = services.filter(s =>
    !query.trim() ||
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.description.toLowerCase().includes(query.toLowerCase())
  )

  const visiblePods = pods.filter(p => 
    !query.trim() ||
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.namespace.toLowerCase().includes(query.toLowerCase())
  )

  const podsByNamespace = visiblePods.reduce((acc, pod) => {
    if (!acc[pod.namespace]) acc[pod.namespace] = []
    acc[pod.namespace].push(pod)
    return acc
  }, {} as Record<string, typeof pods>)

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{t('services.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">
            {t('services.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder={t('services.searchPlaceholder')}
              className="h-9 w-64 rounded-md border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-100 pl-9 pr-4 text-sm outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] transition-all dark:text-slate-200"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              let namespaces = ['admin']
              if (me?.is_super_admin) {
                namespaces = ['all']
              } else {
                const matchingTenants = filterVisibleTenants(me, tenants)
                namespaces = matchingTenants.length > 0 ? matchingTenants.map(t => t.namespace) : ['default']
              }
              fetchServices(namespaces)
            }}
            className="flex items-center gap-1.5 h-9"
          >
            <RefreshCw size={13} /> {t('services.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {visibleServices.map((s, i) => {
          const svcUrl = getServiceUrl(s)
          return (
          <motion.div key={s.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="flex flex-col h-full border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md transition-shadow p-5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-gray-50 to-transparent dark:from-dark-100 dark:to-transparent rounded-bl-full -z-10" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-dark-200 border border-gray-100 dark:border-dark-border shadow-xs">
                    <ServiceIcon service={s.id} size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 tracking-tight">{s.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-200 px-1.5 py-0.5 rounded">
                        {s.category}
                      </span>
                      <span className="text-xs font-mono text-gray-400">{s.namespace}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 leading-relaxed mb-6">
                {s.description}
              </p>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6 p-3 bg-gray-50 dark:bg-dark-100/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'running' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{s.status}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                  <Cpu size={12} className="text-gray-400" />
                  <span>{s.pods} Pods</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                  <Shield size={12} className={s.securityRating >= 4 ? 'text-emerald-500' : 'text-amber-500'} />
                  <span className="font-semibold">{s.securityRating}/5 {locale === 'fr' ? 'Séc' : 'Sec'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">{s.estimatedCost}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 text-[11px] h-8">{t('services.configure')}</Button>
                {svcUrl ? (
                  <Button variant="secondary" className="w-8 h-8 p-0" title={t('services.openConsole')} asChild>
                    <a href={svcUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /></a>
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-8 h-8 p-0" title={t('services.openConsole')} disabled><ExternalLink size={13} /></Button>
                )}
              </div>
            </Card>
          </motion.div>
          )
        })}
      </div>

      <div className="mt-10 mb-4 border-t border-gray-200 dark:border-dark-border pt-8">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Server size={18} className="text-[#0078D4]" /> {t('services.liveWorkloads')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">
          {t('services.liveWorkloadsSubtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(podsByNamespace).map(([ns, nsPods], idx) => (
          <motion.div key={ns} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
            <Card className="overflow-hidden border border-gray-200 dark:border-dark-border shadow-sm">
              <div className="bg-gray-50 dark:bg-dark-100 px-4 py-3 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes size={14} className="text-gray-500" />
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{ns}</span>
                  <Badge variant="gray" size="sm" className="ml-2">{nsPods.length}</Badge>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {nsPods.map(pod => (
                  <div key={pod.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-dark-200/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        pod.ready && pod.phase === 'Running' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        pod.phase === 'Pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {pod.ready && pod.phase === 'Running' ? <CheckCircle2 size={14} /> : pod.phase === 'Pending' ? <RefreshCw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{pod.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 font-mono">
                          <span>{t('services.node')}: {pod.node || (locale === 'fr' ? 'Planification' : 'Scheduling')}</span>
                          <span>•</span>
                          <span>{t('services.restarts')}: {pod.restarts}</span>
                          <span>•</span>
                          <span>{t('services.started')}: {formatRelativeTime(pod.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={pod.phase === 'Running' ? (pod.ready ? 'success' : 'warning') : 'error'} size="sm" className="capitalize shrink-0">
                      {pod.phase} {pod.phase === 'Running' && !pod.ready ? t('services.notReady') : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
        {Object.keys(podsByNamespace).length === 0 && (
          <div className="py-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <Server size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('services.noPods')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('services.noPodsSub')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
