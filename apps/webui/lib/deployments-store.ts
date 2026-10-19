import { create } from 'zustand'
import { apiConfig } from './config'

export interface ArgoApp {
  name: string
  namespace: string
  project: string
  syncStatus: string
  health: string
  repoURL: string
  path: string
  targetRevision: string
  destinationServer: string
  destinationNamespace: string
  lastSyncAt: string | null
}

interface DeploymentsState {
  deployments: ArgoApp[]
  loaded: boolean
  fetchDeployments: () => Promise<void>
}

export const useDeployments = create<DeploymentsState>((set) => ({
  deployments: [],
  loaded: false,
  fetchDeployments: async () => {
    try {
      const res = await fetch(`${apiConfig.url}/api/argocd/applications`)
      if (!res.ok) throw new Error('Failed to fetch Argo CD applications')
      const data = await res.json()
      
      set({ deployments: data as ArgoApp[], loaded: true })
    } catch (e) {
      console.error(e)
    }
  }
}))
