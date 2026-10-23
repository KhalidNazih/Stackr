import { create } from 'zustand'
import { apiConfig } from './config'
import type { PlatformService, K8sPod } from './types'
import servicesCatalog from '@/config/services-catalog.json'

interface ServicesState {
  services: PlatformService[]
  pods: K8sPod[]
  loaded: boolean
  fetchServices: (namespaces?: string[]) => Promise<void>
}

const CATALOG_ENTRIES: Record<string, Partial<PlatformService>> = Object.fromEntries(
  servicesCatalog.map((s: any) => [
    s.id,
    {
      name: s.name,
      category: s.category,
      description: s.desc,
      securityRating: s.securityRating || 5,
      estimatedCost: s.estimatedCost || '$20/mo',
    }
  ])
)

const SERVICE_META: Record<string, Partial<PlatformService>> = {
  ...CATALOG_ENTRIES,
  'sonar': { name: 'SonarQube', category: 'Code Quality', description: 'Continuous inspection of code quality and security vulnerability detection.', securityRating: 5, estimatedCost: '$25/mo' },
  'keycloak': { name: 'Keycloak', category: 'Identity & Access', description: 'Centralized OpenID Connect and OAuth2 Identity and Access Management.', securityRating: 5, estimatedCost: '$0/mo' },
  'openbao': { name: 'OpenBao', category: 'Security & Secrets', description: 'Open-source secret management and encryption service.', securityRating: 5, estimatedCost: '$0/mo' },
  'vault': { name: 'Vault', category: 'Security & Secrets', description: 'Secret management, key rotation, and data encryption.', securityRating: 5, estimatedCost: '$0/mo' },
  'argocd': { name: 'Argo CD', category: 'GitOps', description: 'Declarative, GitOps continuous delivery tool for Kubernetes.', securityRating: 5, estimatedCost: '$0/mo' },
  'argo': { name: 'Argo CD', category: 'GitOps', description: 'Declarative, GitOps continuous delivery tool for Kubernetes.', securityRating: 5, estimatedCost: '$0/mo' },
  'postgres': { name: 'PostgreSQL', category: 'Database', description: 'Relational database service storing platform user data and metadata.', securityRating: 5, estimatedCost: '$15/mo' },
  'redis': { name: 'Redis', category: 'Caching', description: 'In-memory data structure store used for caching and sessions.', securityRating: 4, estimatedCost: '$10/mo' },
  'fastapi': { name: 'FastAPI Backend', category: 'Platform API', description: 'Platform REST API service for Kubernetes and GitOps management.', securityRating: 5, estimatedCost: '$0/mo' },
  'kube-system': { name: 'Kube System', category: 'System', description: 'Core Kubernetes control plane and system services.', securityRating: 5, estimatedCost: '$0/mo' },
}

export const useServices = create<ServicesState>((set) => ({
  services: [],
  pods: [],
  loaded: false,
  fetchServices: async (namespaces: string[] = ['admin']) => {
    try {
      let allServices: any[] = []
      let allPods: any[] = []

      for (const ns of namespaces) {
        if (ns === 'all') {
          const depRes = await fetch(`${apiConfig.url}/api/kubernetes/deployments`)
          if (depRes.ok) allServices.push(...(await depRes.json()))

          const podRes = await fetch(`${apiConfig.url}/api/kubernetes/pods`)
          if (podRes.ok) allPods.push(...(await podRes.json()))
        } else {
          const depRes = await fetch(`${apiConfig.url}/api/kubernetes/namespaces/${ns}/deployments`)
          if (depRes.ok) allServices.push(...(await depRes.json()))

          const podRes = await fetch(`${apiConfig.url}/api/kubernetes/namespaces/${ns}/pods`)
          if (podRes.ok) allPods.push(...(await podRes.json()))
        }
      }
      
      const mapped = allServices.map((d: any) => {
        const metaKey = Object.keys(SERVICE_META).find(k => d.name.includes(k))
        const meta = metaKey ? SERVICE_META[metaKey] : { name: d.name, category: 'Other', description: 'Tenant workload', securityRating: 3, estimatedCost: '$10/mo' }
        return {
          id: d.name,
          name: meta.name,
          version: 'latest',
          status: d.available_replicas >= d.replicas ? 'running' : 'degraded',
          pods: d.available_replicas,
          namespace: d.namespace,
          category: meta.category,
          description: meta.description,
          ha: d.replicas > 1,
          securityRating: meta.securityRating,
          estimatedCost: meta.estimatedCost,
        }
      })
      
      set({ services: mapped as PlatformService[], pods: allPods as K8sPod[], loaded: true })
    } catch (e) {
      console.error(e)
    }
  }
}))
