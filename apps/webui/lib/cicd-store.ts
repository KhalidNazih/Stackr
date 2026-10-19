import { create } from 'zustand'
import { apiConfig } from './config'

export interface Pipeline {
  id: string
  project: string
  commit: string
  status: string
  duration: string
  startedAt: string
}

interface CICDState {
  pipelines: Pipeline[]
  loaded: boolean
  fetchPipelines: () => Promise<void>
  triggerPipeline: (project: string) => Promise<void>
}

export const useCICD = create<CICDState>((set) => ({
  pipelines: [],
  loaded: false,
  fetchPipelines: async () => {
    try {
      const res = await fetch(`${apiConfig.url}/api/gitlab/pipelines`)
      if (!res.ok) throw new Error('Failed to fetch pipelines')
      const data = await res.json()
      set({ pipelines: data, loaded: true })
    } catch (e) {
      console.error(e)
    }
  },
  triggerPipeline: async (project: string) => {
    try {
      await fetch(`${apiConfig.url}/api/gitlab/pipelines`, { method: 'POST' })
      // Optimistic refresh
      const res = await fetch(`${apiConfig.url}/api/gitlab/pipelines`)
      if (res.ok) {
        const data = await res.json()
        set({ pipelines: data })
      }
    } catch (e) {
      console.error(e)
    }
  }
}))
