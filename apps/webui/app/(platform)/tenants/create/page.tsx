'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Check, ChevronRight, ChevronLeft, Info, Star, Zap, Send, ArrowRight,
  Box, Globe, Building2, Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ServiceIcon, SERVICE_META } from '@/components/icons/ServiceIcon'
import { generateYaml } from '@/lib/utils'
import { apiConfig } from '@/lib/config'
import { useMe } from '@/lib/me-store'
import { useTenants } from '@/lib/tenants-store'
import { useT } from '@/lib/i18n/i18n-context'

type EnvType = 'dev' | 'qa' | 'staging' | 'production'
type SizeType = 'small' | 'medium' | 'heavy'
interface ServiceConfig { enabled: boolean; replicas: number; size: SizeType; nodePort?: number }
interface WizardState {
  tenantId: string; displayName: string; businessUnit: string
  envType: EnvType; namespace: string; baseUrl: string
  services: Record<string, ServiceConfig>
  developers?: string[]
}

import servicesCatalog from '@/config/services-catalog.json'
import type { CatalogService } from '@/lib/types'

const SERVICES = servicesCatalog as CatalogService[]

const INITIAL: WizardState = {
  tenantId: '', displayName: '', businessUnit: '', envType: 'dev', namespace: '', baseUrl: '',
  services: Object.fromEntries(
    SERVICES.map(s => [
      s.id,
      {
        enabled: s.defaultEnabled ?? true,
        replicas: s.defaultReplicas || 1,
        size: (s.defaultSize as SizeType) || 'medium'
      }
    ])
  ),
  developers: [],
}

const STEPS = [
  { label: 'Tenant info', desc: 'Identity & ownership' },
  { label: 'DevOps stack', desc: 'Select services' },
  { label: 'Resources', desc: 'Sizing & scaling' },
  { label: 'Review', desc: 'Confirm & submit' },
]

const ENV_OPTS: { value: EnvType; label: string; ring: string }[] = [
  { value: 'dev', label: 'Development', ring: 'data-[state=on]:ring-info-500    data-[state=on]:bg-info-50    data-[state=on]:text-info-700' },
  { value: 'qa', label: 'QA', ring: 'data-[state=on]:ring-warning-500 data-[state=on]:bg-warning-50 data-[state=on]:text-warning-700' },
  { value: 'staging', label: 'Staging', ring: 'data-[state=on]:ring-purple-500  data-[state=on]:bg-purple-50  data-[state=on]:text-purple-700' },
  { value: 'production', label: 'Production', ring: 'data-[state=on]:ring-error-500   data-[state=on]:bg-error-50   data-[state=on]:text-error-700' },
]

// ── Step 1 ──────────────────────────────────────────────────────────────────
function Step1({ state, onChange, isEdit }: { state: WizardState; onChange: (k: keyof WizardState, v: string) => void; isEdit: boolean }) {
  const { t } = useT()
  const getEnvLabel = (val: EnvType) => {
    switch (val) {
      case 'dev': return t('tenants.envDev')
      case 'qa': return 'QA'
      case 'staging': return t('tenants.envStaging')
      case 'production': return t('tenants.envProd')
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>{t('createTenant.tenantId')} <span className="text-error-500">*</span></Label>
          <div className="relative">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <Input
              placeholder="customer-01"
              value={state.tenantId}
              className="pl-9"
              onChange={e => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''); onChange('tenantId', v); onChange('namespace', v ? `${v}-ns` : '') }}
              disabled={isEdit}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-gray-500 dark:text-slate-500">
            {isEdit ? t('createTenant.tenantIdHintEdit') : t('createTenant.tenantIdHint')}
          </p>
        </div>
        <div>
          <Label>{t('createTenant.displayName')} <span className="text-error-500">*</span></Label>
          <Input placeholder="Core Platform Team" value={state.displayName} onChange={e => onChange('displayName', e.target.value)} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>{t('createTenant.businessUnit')}</Label>
          <div className="relative">
            <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <Input placeholder="Digital Products" value={state.businessUnit} className="pl-9" onChange={e => onChange('businessUnit', e.target.value)} />
          </div>
        </div>
        <div>
          <Label>{t('createTenant.namespace')}</Label>
          <div className="relative">
            <Box size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <Input placeholder="auto-generated" value={state.namespace} className="pl-9 font-mono" onChange={e => onChange('namespace', e.target.value)} disabled={isEdit} />
          </div>
        </div>
      </div>

      <div>
        <Label>{t('createTenant.envType')} <span className="text-error-500">*</span></Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ENV_OPTS.map(opt => (
            <button
              key={opt.value}
              data-state={state.envType === opt.value ? 'on' : 'off'}
              onClick={() => onChange('envType', opt.value)}
              className={`rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-200 px-3 py-2.5 text-[13px] font-semibold text-gray-700 dark:text-slate-300 transition-all hover:bg-gray-50 dark:hover:bg-dark-300 ring-1 ring-transparent capitalize ${opt.ring}`}
            >
              {getEnvLabel(opt.value)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>{t('createTenant.publicUrl')}</Label>
        <div className="relative">
          <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <Input placeholder="https://platform.company.com" value={state.baseUrl} className="pl-9" onChange={e => onChange('baseUrl', e.target.value)} />
        </div>
        <p className="mt-1.5 text-[11px] text-gray-500 dark:text-slate-500">{t('createTenant.publicUrlHint')}</p>
      </div>

      <div className="flex gap-3 rounded-lg border border-info-200 bg-info-50 p-4">
        <Info size={14} className="text-info-600 shrink-0 mt-0.5" strokeWidth={2.5} />
        <p className="text-[13px] text-info-700 leading-relaxed">
          {t('createTenant.warningId')}
        </p>
      </div>
    </div>
  )
}

// ── Step 2 ──────────────────────────────────────────────────────────────────
const SIZE_COST = { small: 15, medium: 30, heavy: 60 }
function calculateCost(cfg: ServiceConfig) {
  return (SIZE_COST[cfg.size] || 30) * cfg.replicas
}

function Step2({ state, onToggle }: { state: WizardState; onToggle: (id: string, v: boolean) => void }) {
  const { t } = useT()
  const enabledCount = SERVICES.filter(s => state.services[s.id]?.enabled).length
  const totalCost = SERVICES.filter(s => state.services[s.id]?.enabled).reduce((a, s) => a + (state.services[s.id] ? calculateCost(state.services[s.id]) : 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-100 px-4 py-2.5">
        <span className="text-sm text-gray-700 dark:text-slate-300">
          {t('createTenant.servicesSelected')
            .replace('{count}', String(enabledCount))
            .replace('{total}', String(SERVICES.length))}
        </span>
        <span className="text-sm text-gray-700 dark:text-slate-300">
          {t('createTenant.estimatedCost')}: <span className="font-bold text-brand-teal-dark">${totalCost}/mo</span>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SERVICES.map(svc => {
          const meta = SERVICE_META[svc.id]
          const enabled = state.services[svc.id]?.enabled ?? false

          return (
            <div
              key={svc.id}
              onClick={() => onToggle(svc.id, !enabled)}
              className={`relative cursor-pointer rounded-xl border p-5 transition-all ${enabled
                ? 'border-brand-teal/40 bg-brand-teal-light/30 ring-1 ring-brand-teal/30 shadow-sm'
                : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-200 hover:border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-300'
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <ServiceIcon service={svc.id} size={20} containerSize="w-11 h-11" />
                <Switch checked={enabled} onCheckedChange={v => onToggle(svc.id, v)} onClick={e => e.stopPropagation()} />
              </div>

              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{meta?.name || svc.name}</p>
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 leading-relaxed">{t(`service.${svc.id}.desc` as any) || svc.desc}</p>

              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-200 dark:border-dark-border pt-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">{t('createTenant.scaling')}</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-slate-100 mt-0.5">
                    {t('createTenant.replicasText')
                      .replace('{count}', String(state.services[svc.id]?.replicas || 1))
                      .replace('{plural}', (state.services[svc.id]?.replicas || 1) > 1 ? 's' : '')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">{t('createTenant.security')}</p>
                  <div className="mt-0.5 flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={9} className={i < (svc.securityRating || (svc as any).sec || 5) ? 'text-brand-teal fill-brand-teal' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">{t('createTenant.cost')}</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-slate-100 mt-0.5">${state.services[svc.id] ? calculateCost(state.services[svc.id]) : 0}/mo</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 3 ──────────────────────────────────────────────────────────────────
function Step3({ state, onUpdate }: { state: WizardState; onUpdate: (id: string, k: keyof ServiceConfig, v: any) => void }) {
  const { t } = useT()
  const enabled = SERVICES.filter(s => state.services[s.id]?.enabled)
  const sizes: SizeType[] = ['small', 'medium', 'heavy']

  if (!enabled.length) return (
    <div className="rounded-lg border border-warning-200 bg-warning-50 p-5 text-sm text-warning-700">
      {t('createTenant.noServicesSelected')}
    </div>
  )

  return (
    <div className="space-y-3">
      {enabled.map(svc => {
        const cfg = state.services[svc.id]
        return (
          <div key={svc.id} className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-200 p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-5">
              <ServiceIcon service={svc.id} size={18} containerSize="w-10 h-10" />
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{SERVICE_META[svc.id]?.name || svc.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-slate-500">{t('createTenant.resourceConfig')}</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>{t('createTenant.podSize')}</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => onUpdate(svc.id, 'size', s)}
                      className={`rounded-lg py-2 text-xs font-semibold capitalize transition-all border ${cfg.size === s
                        ? 'border-brand-navy bg-brand-navy text-white shadow-xs'
                        : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-200 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dark-300 hover:text-gray-900 dark:text-slate-100'
                        }`}
                    >
                      {t(`createTenant.size.${s}` as any)}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500 dark:text-slate-500 font-mono">{(svc.resources as any)?.[cfg.size] || 'Standard'} - ${SIZE_COST[cfg.size]}/mo per pod</p>
              </div>

              <div>
                <Label>{t('createTenant.replicas')} <span className="ml-1 text-gray-400 dark:text-slate-500 font-normal">({cfg.replicas})</span></Label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdate(svc.id, 'replicas', Math.max(1, cfg.replicas - 1))}
                    className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-200 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-dark-300 text-lg font-light"
                  >−</button>
                  <div className="flex-1 text-center text-xl font-bold text-gray-900 dark:text-slate-100">{cfg.replicas}</div>
                  <button
                    onClick={() => onUpdate(svc.id, 'replicas', Math.min(5, cfg.replicas + 1))}
                    className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-200 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-dark-300 text-lg font-light"
                  >+</button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Step 4 ──────────────────────────────────────────────────────────────────
function Step4({ state, isManager }: { state: WizardState; isManager: boolean }) {
  const { t } = useT()
  const yaml = generateYaml(state as Parameters<typeof generateYaml>[0])
  const totalCost = Object.values(state.services)
    .filter(cfg => cfg.enabled)
    .reduce((acc, cfg) => acc + calculateCost(cfg), 0)

  const colorize = (line: string): React.ReactNode => {
    if (!line.trim()) return ''
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return <span>{line}</span>
    const key = line.slice(0, colonIdx)
    const rest = line.slice(colonIdx + 1)
    const trimmed = rest.trim()
    let val: React.ReactNode = null
    if (trimmed === 'true' || trimmed === 'false') val = <span className="bool">{trimmed}</span>
    else if (trimmed && !isNaN(Number(trimmed))) val = <span className="num">{trimmed}</span>
    else if (trimmed.startsWith('"')) val = <span className="str">{trimmed}</span>
    else if (trimmed) val = <span>{trimmed}</span>
    const indent = line.match(/^(\s*)/)?.[1] ?? ''
    return <>{indent}<span className="key">{key.trimStart()}</span>:{val ? <> {val}</> : null}</>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-brand-teal/25 bg-brand-teal-light/40 p-4">
        <Zap size={15} className="text-brand-teal-dark shrink-0 mt-0.5" strokeWidth={2.5} />
        <div>
          <p className="text-[13px] font-semibold text-brand-teal-dark">{t('createTenant.readyToCommit')}</p>
          <p className="text-[12px] text-brand-teal-dark/80 mt-0.5 leading-relaxed">
            {t('createTenant.readyToCommitDesc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t('createTenant.tenantId'), value: state.tenantId || '—', mono: true },
          { label: t('dashboard.environment'), value: state.envType, mono: false },
          { label: t('tenants.services'), value: t('createTenant.servicesSelected').replace('{count}', String(Object.values(state.services).filter(s => s.enabled).length)).replace('{total}', String(SERVICES.length)), mono: false },
          { label: t('createTenant.estimatedCost'), value: `$${totalCost}/mo`, mono: false },
        ].map(({ label, value, mono }) => (
          <div key={label} className="rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-100 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">{label}</p>
            <p className={`text-sm font-bold text-gray-900 dark:text-slate-100 mt-0.5 truncate capitalize ${mono ? 'font-mono' : ''}`}>{value}</p>
          </div>
        ))}
      </div>

      {!isManager && (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-error-500/80" />
                <span className="h-3 w-3 rounded-full bg-warning-500/80" />
                <span className="h-3 w-3 rounded-full bg-success-500/80" />
              </div>
              <span className="ml-2 font-mono text-[11px] text-gray-400 dark:text-slate-505">tenants/{state.tenantId || 'tenant-id'}/values.yaml</span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-505 dark:text-slate-505">YAML</span>
          </div>
          <div className="code-editor py-4">
            {yaml.split('\n').map((line, i) => (
              <div key={i} className="flex px-4">
                <span className="ln w-8 shrink-0 text-right pr-4 text-[11px]">{i + 1}</span>
                <span className="flex-1">{colorize(line)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function buildManifest(state: WizardState): Record<string, unknown> {
  const generatePort = () => Math.floor(Math.random() * (32767 - 30000 + 1) + 30000)

  const platformUrl = state.baseUrl || 'http://192.168.253.133'

  return {
    tenant_id: state.tenantId,
    display_name: state.displayName,
    business_unit: state.businessUnit,
    environment: state.envType,
    infrastructure: { cluster_server: 'https://kubernetes.default.svc' },
    isolation: { namespace: state.namespace },
    platform: {
      public_base_url: platformUrl,
      keycloak: {
        internal_url: "http://192.168.253.133:31825",
        public_url: "http://192.168.253.133:31825",
        realm: "Devsecops_Platform_Users"
      }
    },
    services: Object.fromEntries(
      Object.entries(state.services).map(([id, cfg]) => {
        const catSvc = SERVICES.find(s => s.id === id)
        const client_id = catSvc?.clientId || (id === 'gitlab' ? 'Gitlab' : id === 'jenkins' ? 'Jenkins' : id === 'nexus' ? 'nexus' : id)
        const node_port = cfg.nodePort || cfg.nodePort === 0 ? cfg.nodePort : generatePort()
        return [
          id,
          cfg.enabled
            ? { enabled: true, node_port, client_id, replicas: cfg.replicas }
            : { enabled: false, node_port, client_id }
        ]
      })
    ),
    access: {
      groups: {
        admins: `${state.tenantId}-admins`,
        users: `${state.tenantId}-users`,
        developers: state.developers || [],
      },
    },
  }
}

// ── Wizard Inner ────────────────────────────────────────────────────────────
function TenantWizard() {
  const { me } = useMe()
  const { t } = useT()
  const isManager = !me?.is_super_admin

  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const router = useRouter()

  const { tenants, loaded, reload } = useTenants()

  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const setField = (k: keyof WizardState, v: string) => setState((s: WizardState) => ({ ...s, [k]: v }))
  const toggleSvc = (id: string, enabled: boolean) => setState((s: WizardState) => ({ ...s, services: { ...s.services, [id]: { ...s.services[id], enabled } } }))
  const updateSvc = (id: string, k: keyof ServiceConfig, v: any) => setState((s: WizardState) => ({ ...s, services: { ...s.services, [id]: { ...s.services[id], [k]: v } } }))

  useEffect(() => {
    if (loaded && editId && !initialized) {
      const existingTenant = tenants.find(t => t.id === editId)
      if (existingTenant) {
        const servicesConfig: Record<string, ServiceConfig> = {}
        SERVICES.forEach(s => {
          const manifestSvc = (existingTenant.manifest as any)?.services?.[s.id] as any
          servicesConfig[s.id] = {
            enabled: !!manifestSvc?.enabled,
            replicas: Number(manifestSvc?.replicas) || 1,
            size: (manifestSvc?.size as SizeType) || 'medium',
            nodePort: manifestSvc?.node_port
          }
        })
        setState({
          tenantId: existingTenant.id,
          displayName: existingTenant.displayName,
          businessUnit: existingTenant.businessUnit,
          envType: existingTenant.envType,
          namespace: existingTenant.namespace,
          baseUrl: ((existingTenant.manifest as any)?.platform?.public_base_url as string) || '',
          services: servicesConfig,
          developers: existingTenant.developers || []
        })
      }
      setInitialized(true)
    }
  }, [loaded, editId, tenants, initialized])

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const manifest = buildManifest(state)
      const raw_yaml = generateYaml(state as Parameters<typeof generateYaml>[0], me?.email)
      const [registryRes, keycloakRes] = await Promise.all([
        fetch(`${apiConfig.url}/api/gitlab/registry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: state.tenantId, manifest, raw_yaml }),
        }),
        fetch(`${apiConfig.url}/api/keycloak/tenants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: state.tenantId, display_name: state.displayName }),
        }),
      ])
      if (!registryRes.ok) throw new Error(await registryRes.text() || 'GitLab registry error')
      if (!keycloakRes.ok) throw new Error(await keycloakRes.text() || 'Keycloak error')
      await reload()
      setSubmitted(true)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const canNext = () => {
    if (step === 0) return state.tenantId.length > 0 && state.displayName.length > 0
    if (step === 1) return Object.values(state.services).some((s: ServiceConfig) => s.enabled)
    return true
  }

  const steps = [
    { label: t('createTenant.step1Label'), desc: t('createTenant.step1Desc') },
    { label: t('createTenant.step2Label'), desc: t('createTenant.step2Desc') },
    { label: t('createTenant.step3Label'), desc: t('createTenant.step3Desc') },
    { label: t('createTenant.step4Label'), desc: t('createTenant.step4Desc') },
  ]

  if (submitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-teal-light ring-1 ring-brand-teal/30">
          <Check size={30} className="text-brand-teal" strokeWidth={2.5} />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {editId ? t('createTenant.successTitleEdit') : t('createTenant.successTitle')}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
            {editId
              ? t('createTenant.successDescEdit').replace('{id}', state.tenantId)
              : t('createTenant.successDesc').replace('{id}', state.tenantId)
            }
          </p>
        </div>
        <Card className="max-w-sm w-full">
          <CardContent className="pt-5 space-y-3">
            {[
              { label: t('createTenant.tenantId'), value: state.tenantId, mono: true },
              { label: t('dashboard.environment'), value: state.envType, mono: false },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-500">{label}</span>
                <span className={`font-semibold text-gray-900 dark:text-slate-100 ${mono ? 'font-mono' : ''}`}>{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-500">{t('tenantDetail.status')}</span>
              <Badge variant="success" dot>{editId ? t('createTenant.syncing') : t('createTenant.provisioning')}</Badge>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          {editId ? (
            <>
              <Button variant="secondary" asChild><Link href={`/tenants/${state.tenantId}`}>{t('createTenant.backToTenant')}</Link></Button>
              <Button variant="primary" asChild><Link href="/tenants">{t('createTenant.viewAllTenants')} <ArrowRight size={14} /></Link></Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => { setState(INITIAL); setSubmitted(false); setStep(0) }}>{t('createTenant.createAnother')}</Button>
              <Button variant="primary" asChild><Link href="/admin">{t('createTenant.viewAdminPanel')} <ArrowRight size={14} /></Link></Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
          {editId ? t('createTenant.titleEdit') : t('createTenant.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-505">
          {editId ? t('createTenant.descEdit').replace('{name}', state.displayName || editId) : t('createTenant.desc')}
        </p>
      </div>

      {/* Stepper */}
      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-200 p-4 shadow-xs">
        <div className="flex items-start">
          {steps.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-start">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${i < step ? 'bg-brand-teal text-white'
                  : i === step ? 'bg-brand-navy text-white ring-4 ring-brand-navy/15'
                    : 'bg-gray-100 dark:bg-dark-300 text-gray-400 dark:text-slate-505'
                  }`}>
                  {i < step ? <Check size={13} strokeWidth={3} /> : i + 1}
                </div>
                <div className="text-center mt-1">
                  <p className={`text-[12px] font-semibold ${i === step ? 'text-brand-navy' : i < step ? 'text-gray-900 dark:text-slate-100' : 'text-gray-400 dark:text-slate-505'}`}>{s.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-555 leading-tight">{s.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 mt-4 mx-1 transition-colors ${i < step ? 'bg-brand-teal' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
              {step === 0 && <Step1 state={state} onChange={setField} isEdit={!!editId} />}
              {step === 1 && <Step2 state={state} onToggle={toggleSvc} />}
              {step === 2 && <Step3 state={state} onUpdate={updateSvc} />}
              {step === 3 && <Step4 state={state} isManager={isManager} />}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {submitError && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-[13px] text-rose-700 dark:text-rose-400">
          <Info size={14} className="shrink-0" />
          {submitError}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setStep((s: number) => s - 1)} disabled={step === 0 || submitting}>
          <ChevronLeft size={14} /> {t('projectDetail.back')}
        </Button>
        <span className="text-[12px] font-medium text-gray-400 dark:text-slate-505">
          {t('createTenant.stepOf').replace('{current}', String(step + 1)).replace('{total}', String(steps.length))}
        </span>
        {step < steps.length - 1
          ? <Button variant="primary" onClick={() => setStep((s: number) => s + 1)} disabled={!canNext()}>Continue <ChevronRight size={14} /></Button>
          : <Button variant="teal" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send size={13} />}
            {submitting ? t('common.loading') : editId ? t('common.save') : t('createTenant.submitRequest')}
          </Button>
        }
      </div>
    </div>
  )
}

// ── Wizard shell ────────────────────────────────────────────────────────────
export default function CreateTenantPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0078D4] border-t-transparent" />
      </div>
    }>
      <TenantWizard />
    </Suspense>
  )
}
