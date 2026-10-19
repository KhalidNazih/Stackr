export type ServiceStatus = 'running' | 'degraded' | 'offline' | 'pending'
export type EnvType = 'dev' | 'qa' | 'staging' | 'production'
export type RequestStatus = 'pending' | 'approved' | 'rejected'
export type UserRole = 'admin' | 'developer' | 'devops' | 'auditor' | 'readonly'

export interface K8sPod {
  name: string
  namespace: string
  phase: string
  ready: boolean
  restarts: number
  node: string
  created_at: string
}

export interface PlatformService {
  id: string
  name: string
  version: string
  status: ServiceStatus
  pods: number
  namespace: string
  category: string
  description: string
  ha: boolean
  securityRating: number
  estimatedCost: string
  resources: { small: string; medium: string; heavy: string }
}

export interface Tenant {
  id: string
  displayName: string
  businessUnit: string
  envType: EnvType
  namespace: string
  status: 'healthy' | 'degraded' | 'provisioning'
  pods: number
  services: string[]
  createdAt: Date
  owner: string
  developers: string[]
  manifest: Record<string, unknown>
}

export interface ProvisioningRequest {
  id: string
  tenantId: string
  displayName: string
  requestedBy: string
  requestedAt: Date
  status: RequestStatus
  envType: EnvType
  services: string[]
  riskScore: 'low' | 'medium' | 'high'
  estimatedCost: string
  comment?: string
}

export interface ActivityEvent {
  id: string
  type: 'deploy' | 'sync' | 'approve' | 'reject' | 'alert' | 'create'
  message: string
  tenant?: string
  timestamp: Date
  severity: 'info' | 'success' | 'warning' | 'error'
}

export interface DeploymentPoint {
  date: string
  deployments: number
  success: number
  failed: number
}
