'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Tenant } from './types'
import { apiConfig } from './config'

function mapManifest(item: { tenant_id: string; manifest: Record<string, unknown> }): Tenant {
  const m = item.manifest as Record<string, any>
  const svcs = (m.services ?? {}) as Record<string, { enabled?: boolean }>
  return {
    id: item.tenant_id,
    displayName: (m.display_name as string) ?? item.tenant_id,
    businessUnit: (m.business_unit as string) ?? '',
    envType: ((m.environment as string) ?? 'dev') as Tenant['envType'],
    namespace: ((m.isolation as any)?.namespace as string) ?? `${item.tenant_id}-ns`,
    status: 'provisioning',
    pods: 0,
    services: Object.entries(svcs).filter(([, s]) => s.enabled).map(([id]) => id),
    createdAt: new Date(),
    owner: ((m.access as any)?.groups?.admins as string) ?? '',
    developers: ((m.access as any)?.groups?.developers as string[]) ?? [],
    manifest: item.manifest,
  }
}

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`${apiConfig.url}/api/gitlab/registry`)
      if (res.ok) {
        const data: Array<{ tenant_id: string; manifest: Record<string, unknown> }> = await res.json()
        setTenants(data.map(mapManifest))
      } else {
        setError(`Registry unavailable (${res.status})`)
      }
    } catch {
      setError('Could not reach backend')
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const provision = useCallback(async (tenantId: string, manifest: Record<string, unknown>): Promise<void> => {
    const res = await fetch(`${apiConfig.url}/api/gitlab/registry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, manifest }),
    })
    if (!res.ok) throw new Error(`GitLab commit failed: ${res.statusText}`)
    await load()
  }, [load])

  const deprovision = useCallback(async (tenantId: string): Promise<void> => {
    const res = await fetch(`${apiConfig.url}/api/gitlab/registry/${tenantId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`Deprovision failed: ${res.statusText}`)
    await load()
  }, [load])

  return { tenants, loaded, error, provision, updateTenant: provision, deprovision, reload: load }
}
