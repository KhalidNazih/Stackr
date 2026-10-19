import { apiConfig } from '@/lib/config'

export type ArgoSyncStatus = 'Synced' | 'OutOfSync' | 'Unknown'
export type ArgoHealth = 'Healthy' | 'Progressing' | 'Degraded' | 'Suspended' | 'Missing'

export interface ArgoApplication {
  name: string
  namespace: string
  project: string
  syncStatus: ArgoSyncStatus
  health: ArgoHealth
  repoURL: string
  path: string
  targetRevision: string
  destinationServer: string
  destinationNamespace: string
  lastSyncAt?: string
}

export function isArgoCDConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ARGOCD_URL)
}

export async function listApplications(argoProject?: string): Promise<ArgoApplication[]> {
  const params = argoProject ? `?project=${encodeURIComponent(argoProject)}` : ''
  const res = await fetch(`${apiConfig.url}/api/argocd/applications${params}`)
  if (!res.ok) throw new Error(`List Argo applications failed: ${res.statusText}`)
  return res.json()
}

export async function getApplicationStatus(name: string): Promise<ArgoApplication> {
  const res = await fetch(`${apiConfig.url}/api/argocd/applications/${name}`)
  if (!res.ok) throw new Error(`Get Argo application failed: ${res.statusText}`)
  return res.json()
}

export async function syncApplication(appName: string): Promise<void> {
  const res = await fetch(`${apiConfig.url}/api/argocd/applications/${appName}/sync`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Sync Argo application failed: ${res.statusText}`)
}

export async function createApplication(manifest: Partial<ArgoApplication> & {
  repoURL: string
  path: string
  destinationNamespace: string
}): Promise<ArgoApplication> {
  const res = await fetch(`${apiConfig.url}/api/argocd/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: manifest.name,
      project: manifest.project ?? 'default',
      repo_url: manifest.repoURL,
      path: manifest.path,
      target_revision: manifest.targetRevision ?? 'HEAD',
      destination_server: manifest.destinationServer ?? 'https://kubernetes.default.svc',
      destination_namespace: manifest.destinationNamespace,
    }),
  })
  if (!res.ok) throw new Error(`Create Argo application failed: ${res.statusText}`)
  return res.json()
}

export async function deleteApplication(appName: string): Promise<void> {
  const res = await fetch(`${apiConfig.url}/api/argocd/applications/${appName}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Delete Argo application failed: ${res.statusText}`)
}
