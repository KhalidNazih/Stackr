'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiConfig } from './config'

export interface PlatformPod {
  name: string
  namespace: string
  phase: string
  ready: boolean
  restarts: number
  created_at: string
}

/**
 * Fetch pods from a Kubernetes namespace.
 * Pass null to disable the request (e.g. while waiting for /api/me to resolve).
 */
export function useNamespacePods(namespace: string | null) {
  const [pods, setPods] = useState<PlatformPod[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    if (!namespace) {
      setPods([])
      setLoaded(true)
      return
    }
    try {
      const url = namespace === 'all' 
        ? `${apiConfig.url}/api/kubernetes/pods`
        : `${apiConfig.url}/api/kubernetes/namespaces/${namespace}/pods`
      const res = await fetch(url)
      if (res.ok) {
        setPods(await res.json())
      } else {
        setPods([])
      }
    } catch {
      setPods([])
    } finally {
      setLoaded(true)
    }
  }, [namespace])

  useEffect(() => { setLoaded(false); load() }, [load])

  const runningCount = pods.filter(p => p.phase === 'Running').length
  return { pods, loaded, runningCount }
}

// Convenience alias for the platform admin namespace
export const useAdminPods = () => useNamespacePods('admin')
