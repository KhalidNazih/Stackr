import type { PlatformService, Tenant, ProvisioningRequest, ActivityEvent, DeploymentPoint } from './types'

export const PLATFORM_SERVICES: PlatformService[] = [
  {
    id: 'gitlab',
    name: 'GitLab',
    version: '17.4.2',
    status: 'running',
    pods: 3,
    namespace: 'devops-platform',
    category: 'Source Control',
    description: 'Git repository management, CI/CD pipelines, and code review platform.',
    ha: true,
    securityRating: 5,
    estimatedCost: '$45/mo',
    resources: { small: '2 CPU · 4 Gi', medium: '4 CPU · 8 Gi', heavy: '8 CPU · 16 Gi' },
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    version: '2.474',
    status: 'running',
    pods: 2,
    namespace: 'devops-platform',
    category: 'CI/CD',
    description: 'Open-source automation server for continuous integration and delivery.',
    ha: false,
    securityRating: 3,
    estimatedCost: '$20/mo',
    resources: { small: '1 CPU · 2 Gi', medium: '2 CPU · 4 Gi', heavy: '4 CPU · 8 Gi' },
  },
  {
    id: 'nexus',
    name: 'Nexus',
    version: '3.72.0',
    status: 'running',
    pods: 1,
    namespace: 'devops-platform',
    category: 'Artifacts',
    description: 'Universal artifact repository manager for storing build artifacts.',
    ha: true,
    securityRating: 4,
    estimatedCost: '$30/mo',
    resources: { small: '2 CPU · 4 Gi', medium: '4 CPU · 8 Gi', heavy: '8 CPU · 16 Gi' },
  },
  {
    id: 'sonarqube',
    name: 'SonarQube',
    version: '10.7.0',
    status: 'running',
    pods: 2,
    namespace: 'devops-platform',
    category: 'Code Quality',
    description: 'Continuous inspection of code quality and security vulnerability detection.',
    ha: false,
    securityRating: 5,
    estimatedCost: '$25/mo',
    resources: { small: '2 CPU · 4 Gi', medium: '4 CPU · 8 Gi', heavy: '8 CPU · 16 Gi' },
  },
]

export const TENANTS: Tenant[] = [
  {
    id: 'customer-01',
    displayName: 'Alpha Engineering',
    businessUnit: 'Digital Products',
    envType: 'production',
    namespace: 'customer-01-ns',
    status: 'healthy',
    pods: 48,
    services: ['gitlab', 'nexus', 'sonarqube'],
    createdAt: new Date('2024-10-15'),
    owner: 'marie.dupont@stackr.com',
    developers: ['dev1@stackr.com', 'dev2@stackr.com'],
    manifest: {
      display_name: 'Alpha Engineering',
      business_unit: 'Digital Products',
      environment: 'production',
      isolation: { namespace: 'customer-01-ns' },
      access: {
        groups: {
          admins: 'marie.dupont@stackr.com',
          developers: ['dev1@stackr.com', 'dev2@stackr.com']
        }
      },
      services: {
        gitlab: { enabled: true },
        nexus: { enabled: true },
        sonarqube: { enabled: true }
      }
    }
  },
  {
    id: 'blue-team',
    displayName: 'Blue Team',
    businessUnit: 'Infrastructure',
    envType: 'staging',
    namespace: 'blue-team-ns',
    status: 'degraded',
    pods: 12,
    services: ['gitlab', 'jenkins'],
    createdAt: new Date('2024-11-03'),
    owner: 'ahmed.benali@stackr.com',
    developers: ['dev3@stackr.com'],
    manifest: {
      display_name: 'Blue Team',
      business_unit: 'Infrastructure',
      environment: 'staging',
      isolation: { namespace: 'blue-team-ns' },
      access: {
        groups: {
          admins: 'ahmed.benali@stackr.com',
          developers: ['dev3@stackr.com']
        }
      },
      services: {
        gitlab: { enabled: true },
        jenkins: { enabled: true }
      }
    }
  },
  {
    id: 'dev-squad',
    displayName: 'Dev Squad',
    businessUnit: 'R&D',
    envType: 'dev',
    namespace: 'dev-squad-ns',
    status: 'healthy',
    pods: 8,
    services: ['gitlab', 'sonarqube'],
    createdAt: new Date('2024-12-01'),
    owner: 'lucas.martin@stackr.com',
    developers: [],
    manifest: {
      display_name: 'Dev Squad',
      business_unit: 'R&D',
      environment: 'dev',
      isolation: { namespace: 'dev-squad-ns' },
      access: {
        groups: {
          admins: 'lucas.martin@stackr.com',
          developers: []
        }
      },
      services: {
        gitlab: { enabled: true },
        sonarqube: { enabled: true }
      }
    }
  },
]

export const PROVISIONING_REQUESTS: ProvisioningRequest[] = [
  {
    id: 'req-001',
    tenantId: 'alpha-team',
    displayName: 'Alpha Team',
    requestedBy: 'sarah.chen@stackr.com',
    requestedAt: new Date(Date.now() - 3600000),
    status: 'pending',
    envType: 'staging',
    services: ['gitlab', 'jenkins', 'nexus', 'sonarqube'],
    riskScore: 'low',
    estimatedCost: '$120/mo',
  },
  {
    id: 'req-002',
    tenantId: 'beta-ops',
    displayName: 'Beta Ops',
    requestedBy: 'thomas.roux@stackr.com',
    requestedAt: new Date(Date.now() - 7200000),
    status: 'pending',
    envType: 'production',
    services: ['gitlab', 'nexus'],
    riskScore: 'medium',
    estimatedCost: '$75/mo',
  },
  {
    id: 'req-003',
    tenantId: 'gamma-dev',
    displayName: 'Gamma Dev',
    requestedBy: 'amina.khalil@stackr.com',
    requestedAt: new Date(Date.now() - 86400000),
    status: 'approved',
    envType: 'dev',
    services: ['gitlab', 'sonarqube'],
    riskScore: 'low',
    estimatedCost: '$70/mo',
    comment: 'Standard dev environment. Approved.',
  },
]

export const ACTIVITY_EVENTS: ActivityEvent[] = [
  { id: '1', type: 'sync', message: 'GitLab synced to cluster — customer-01', tenant: 'customer-01', timestamp: new Date(Date.now() - 300000), severity: 'success' },
  { id: '2', type: 'deploy', message: 'Nexus 3.72.0 deployed — devops-platform', timestamp: new Date(Date.now() - 900000), severity: 'success' },
  { id: '3', type: 'alert', message: 'SonarQube: 2 critical issues in blue-team', tenant: 'blue-team', timestamp: new Date(Date.now() - 1800000), severity: 'warning' },
  { id: '4', type: 'approve', message: 'Tenant gamma-dev approved by admin', tenant: 'gamma-dev', timestamp: new Date(Date.now() - 3600000), severity: 'info' },
  { id: '5', type: 'deploy', message: 'Jenkins pipeline run #247 — success', timestamp: new Date(Date.now() - 5400000), severity: 'success' },
  { id: '6', type: 'sync', message: 'Argo CD sync drift detected — blue-team', tenant: 'blue-team', timestamp: new Date(Date.now() - 7200000), severity: 'warning' },
  { id: '7', type: 'create', message: 'New provisioning request: alpha-team', timestamp: new Date(Date.now() - 9000000), severity: 'info' },
]

export const DEPLOYMENT_CHART_DATA: DeploymentPoint[] = [
  { date: 'Mon', deployments: 12, success: 11, failed: 1 },
  { date: 'Tue', deployments: 19, success: 18, failed: 1 },
  { date: 'Wed', deployments: 8,  success: 8,  failed: 0 },
  { date: 'Thu', deployments: 24, success: 22, failed: 2 },
  { date: 'Fri', deployments: 31, success: 29, failed: 2 },
  { date: 'Sat', deployments: 7,  success: 7,  failed: 0 },
  { date: 'Sun', deployments: 23, success: 23, failed: 0 },
]
