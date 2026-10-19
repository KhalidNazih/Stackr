import { create } from 'zustand'
import { apiConfig } from './config'

export interface GitOpsApp {
  id: string
  name: string
  cluster: string
  namespace: string
  status: string
  health: string
  lastSync: string
}

export interface GitOpsCommit {
  id: string
  msg: string
  author: string
  ago: string
}

interface GitOpsState {
  apps: GitOpsApp[]
  commits: GitOpsCommit[]
  loaded: boolean
  fetchApps: () => Promise<void>
  fetchCommits: () => Promise<void>
  syncApp: (id: string) => Promise<void>
}

export const useGitOps = create<GitOpsState>((set) => ({
  apps: [],
  commits: [],
  loaded: false,
  fetchApps: async () => {
    try {
      const res = await fetch(`${apiConfig.url}/api/argocd/applications`)
      if (!res.ok) throw new Error('Failed to fetch apps')
      const data = await res.json()
      const mapped = data.map((app: any) => ({
        id: app.name,
        name: app.name,
        cluster: app.destinationServer || 'in-cluster',
        namespace: app.destinationNamespace || app.namespace,
        status: app.syncStatus || 'Unknown',
        health: app.health || 'Unknown',
        lastSync: app.lastSyncAt || new Date().toISOString(),
      }))
      set({ apps: mapped, loaded: true })
    } catch (e) {
      console.error(e)
    }
  },
  fetchCommits: async () => {
    try {
      const res = await fetch(`${apiConfig.url}/api/gitlab/commits`)
      if (res.ok) {
        const data = await res.json()
        set({ commits: data })
      }
    } catch (e) {
      console.error(e)
    }
  },
  syncApp: async (id: string) => {
    try {
      await fetch(`${apiConfig.url}/api/argocd/applications/${id}/sync`, { method: 'POST' })
      // Optimistic update
      set((state) => ({
        apps: state.apps.map(app => app.id === id ? { ...app, status: 'Synced', health: 'Healthy', lastSync: new Date().toISOString() } : app)
      }))
    } catch (e) {
      console.error(e)
    }
  }
}))
