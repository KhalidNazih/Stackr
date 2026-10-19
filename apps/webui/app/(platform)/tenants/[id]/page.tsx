'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Server, Trash2, Edit3, Settings, ShieldAlert,
  Activity, ArrowLeft, DollarSign, Cloud, Box, Users as UsersIcon, Plus
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ServiceIcon } from '@/components/icons/ServiceIcon'
import { useTenants } from '@/lib/tenants-store'
import { useMe, tenantRole } from '@/lib/me-store'
import { cn } from '@/lib/utils'
import { apiConfig } from '@/lib/config'
import { useT } from '@/lib/i18n/i18n-context'

export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const { me } = useMe()
  const { tenants, loaded, deprovision, provision } = useTenants()

  const [isDeleting, setIsDeleting] = useState(false)
  const [newDevEmail, setNewDevEmail] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const { t, locale } = useT()
  
  const tenant = useMemo(() => tenants.find(t => t.id === tenantId), [tenants, tenantId])
  const role = tenantRole(me, tenantId)
  const isAdmin = role === 'admin' || me?.is_super_admin

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0078D4] border-t-transparent" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/tenants"><ArrowLeft size={14} className="mr-2" /> {t('tenantDetail.backToTenants')}</Link>
        </Button>
        <Card className="py-16 text-center">
          <ShieldAlert size={32} className="mx-auto mb-3 text-rose-400" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('tenantDetail.notFound')}</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.notFoundDesc').replace('{id}', tenantId)}</p>
        </Card>
      </div>
    )
  }

  // Basic billing estimation
  const SERVICE_PRICE = 15 // $15 per service
  const BASE_PRICE = tenant.envType === 'production' ? 100 : tenant.envType === 'staging' ? 50 : 20
  const estimatedCost = BASE_PRICE + (tenant.services.length * SERVICE_PRICE)

  const handleUpdateDevelopers = async (newDevs: string[], email: string, action: 'add' | 'remove') => {
    setIsUpdating(true)
    try {
      // 1. Call Keycloak API directly for instant updates
      const userGroup = (tenant.manifest as any)?.access?.groups?.users || `${tenant.id}-users`
      const method = action === 'add' ? 'POST' : 'DELETE'
      const kcRes = await fetch(`${apiConfig.url}/api/keycloak/groups/${userGroup}/members/${email}`, {
        method
      })
      if (!kcRes.ok) {
        const err = await kcRes.json().catch(() => ({ detail: kcRes.statusText }))
        throw new Error(err.detail || `Keycloak error: ${kcRes.statusText}`)
      }

      // 2. Update and commit GitLab manifest
      const manifest: any = { ...tenant.manifest }
      manifest.access = { ...(manifest.access || {}) }
      manifest.access.groups = { ...(manifest.access.groups || {}) }
      manifest.access.groups.developers = newDevs
      
      await provision(tenant.id, manifest)
      setNewDevEmail('')
    } catch (err: any) {
      alert(t('tenantDetail.updateDevsError') + ': ' + err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddDev = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = newDevEmail.trim()
    if (!email || tenant.developers.includes(email)) return
    await handleUpdateDevelopers([...tenant.developers, email], email, 'add')
  }

  const handleRemoveDev = async (email: string) => {
    if (!confirm(t('tenantDetail.revokeConfirm').replace('{email}', email))) return
    await handleUpdateDevelopers(tenant.developers.filter(d => d !== email), email, 'remove')
  }

  const handleDelete = async () => {
    if (!confirm(t('tenantDetail.deleteConfirm').replace('{name}', tenant.displayName))) return
    setIsDeleting(true)
    try {
      await deprovision(tenant.id)
      router.push('/tenants')
    } catch (err) {
      alert(t('tenantDetail.deleteError'))
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Back & Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-3">
          <Link href="/tenants"><ArrowLeft size={14} className="mr-2" /> {t('projectDetail.back')}</Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0078D4] to-[#106EBE] text-xl font-bold text-white shadow-lg">
              {tenant.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {tenant.displayName}
                <Badge variant={tenant.envType === 'production' ? 'error' : tenant.envType === 'staging' ? 'warning' : 'info'} size="sm" className="ml-2">
                  {tenant.envType}
                </Badge>
              </h1>
              <p className="mt-1 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                {tenant.namespace}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button variant="danger" size="md" onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 size={13} className="mr-1.5" /> {isDeleting ? t('tenantDetail.deleting') : t('tenantDetail.delete')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Left Column: Setup details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Settings size={18} className="text-[#0078D4]" /> {t('tenantDetail.currentSetup')}
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.owner')}</p>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{tenant.owner}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.businessUnit')}</p>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{tenant.businessUnit || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.status')}</p>
                <p className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <span className={cn("h-2 w-2 rounded-full", tenant.status === 'healthy' ? "bg-emerald-500" : "bg-amber-500")} />
                  <span className="capitalize">{tenant.status}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.deployedServices').replace('{count}', String(tenant.services.length))}</p>
              {tenant.services.length === 0 ? (
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.noServices')}</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {tenant.services.map(svc => (
                    <div key={svc} className="flex items-center gap-3 p-3 rounded-lg border bg-black/5 dark:bg-white/5 border-gray-200 dark:border-gray-800">
                      <ServiceIcon service={svc} size={16} containerSize="w-8 h-8" />
                      <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{svc.replace('-', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Activity size={18} className="text-[#0078D4]" /> {t('tenantDetail.resourceUsage')}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                <Cloud size={16} className="text-sky-500 mb-2" />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{tenant.pods}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.activePods')}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                <Server size={16} className="text-violet-500 mb-2" />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{tenant.services.length}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.services')}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                <Box size={16} className="text-emerald-500 mb-2" />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{tenant.envType === 'production' ? '3' : '1'}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.nodes')}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                <Activity size={16} className="text-rose-500 mb-2" />
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>99.9%</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.uptime')}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <UsersIcon size={18} className="text-[#0078D4]" /> {t('tenantDetail.teamAccess')}
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('tenantDetail.developers')}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.developersDesc')}</p>
                </div>
              </div>

              {isAdmin && (
                <form onSubmit={handleAddDev} className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={newDevEmail}
                    onChange={e => setNewDevEmail(e.target.value)}
                    placeholder={t('tenantDetail.devEmailPlaceholder')}
                    className="flex-1 rounded-md border px-3 py-1.5 text-sm outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
                    disabled={isUpdating}
                  />
                  <Button type="submit" size="sm" variant="primary" disabled={isUpdating || !newDevEmail.trim()}>
                    {isUpdating ? <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1.5" /> : <Plus size={14} className="mr-1.5" />}
                    {t('tenantDetail.add')}
                  </Button>
                </form>
              )}

              {tenant.developers.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.noDevsAssigned')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tenant.developers.map(dev => (
                    <div key={dev} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-xs uppercase">
                          {dev.slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{dev}</span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveDev(dev)}
                          disabled={isUpdating}
                          className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Billing & Actions */}
        <div className="space-y-6">
          {isAdmin && (
            <Card className="p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign size={80} />
              </div>
              <h2 className="text-base font-bold flex items-center gap-2 mb-2 relative" style={{ color: 'var(--text-primary)' }}>
                <DollarSign size={18} className="text-emerald-500" /> {t('tenantDetail.billingEstimate')}
              </h2>
              <p className="text-xs mb-6 relative" style={{ color: 'var(--text-muted)' }}>{t('tenantDetail.billingEstimateDesc')}</p>
              
              <div className="flex items-baseline gap-1 mb-6 relative">
                <span className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>${estimatedCost}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>/ mo</span>
              </div>

              <div className="space-y-3 relative">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{t('tenantDetail.baseEnvironment').replace('{type}', tenant.envType)}</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>${BASE_PRICE}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{t('tenantDetail.servicesCost').replace('{count}', String(tenant.services.length)).replace('{price}', String(SERVICE_PRICE))}</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>${tenant.services.length * SERVICE_PRICE}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between text-sm font-bold">
                  <span style={{ color: 'var(--text-primary)' }}>{t('tenantDetail.total')}</span>
                  <span className="text-emerald-500">${estimatedCost}</span>
                </div>
              </div>
            </Card>
          )}

          {isAdmin && (
            <Card className="p-6 border-blue-500/20 bg-blue-500/5">
              <h3 className="text-sm font-bold mb-2 text-blue-600 dark:text-blue-400">{t('tenantDetail.manageTenant')}</h3>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-4">
                {t('tenantDetail.manageDesc')}
              </p>
              <Button variant="primary" className="w-full" asChild>
                <Link href={`/tenants/create?edit=${tenant.id}`}>
                  <Edit3 size={14} className="mr-2" /> {t('tenantDetail.modifySetup')}
                </Link>
              </Button>
            </Card>
          )}
        </div>

      </div>
    </div>
  )
}
