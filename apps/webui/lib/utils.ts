import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function generateYaml(state: any, creatorEmail?: string): string {
  const lines: string[] = []
  lines.push(`tenant_id: "${state.tenantId}"`)
  lines.push(`display_name: "${state.displayName}"`)
  lines.push(`business_unit: "${state.businessUnit || ''}"`)
  lines.push(`environment: "${state.envType || 'dev'}"`)
  lines.push(`infrastructure:`)
  lines.push(`  cluster_server: "https://kubernetes.default.svc"`)
  lines.push(`isolation:`)
  lines.push(`  namespace: "${state.namespace}"`)
  lines.push(`platform:`)
  lines.push(`  public_base_url: "${state.baseUrl || 'http://192.168.253.133'}"`)
  lines.push(`  keycloak:`)
  lines.push(`    internal_url: "http://192.168.253.133:31825"`)
  lines.push(`    public_url: "http://192.168.253.133:31825"`)
  lines.push(`    realm: "Devsecops_Platform_Users"`)
  lines.push(`services:`)
  for (const [svcId, svc] of Object.entries(state.services)) {
    const s = svc as any
    const clientId = s.client_id || s.clientId || (svcId === 'gitlab' ? 'Gitlab' : svcId === 'jenkins' ? 'Jenkins' : svcId === 'nexus' ? 'nexus' : svcId)
    const nodePort = s.nodePort || s.node_port || Math.floor(Math.random() * (32767 - 30000 + 1) + 30000)
    lines.push(`  ${svcId}:`)
    lines.push(`    enabled: ${s.enabled}`)
    lines.push(`    node_port: ${nodePort}`)
    lines.push(`    client_id: "${clientId}"`)
    if (s.enabled && s.replicas) {
      lines.push(`    replicas: ${s.replicas}`)
    }
  }
  lines.push(`access:`)
  lines.push(`  groups:`)
  lines.push(`    admins: "${state.tenantId}-admins"`)
  lines.push(`    users: "${state.tenantId}-users"`)
  if (state.developers && Array.isArray(state.developers) && state.developers.length > 0) {
    lines.push(`    developers:`)
    state.developers.forEach((d: string) => {
      lines.push(`      - "${d}"`)
    })
  }
  if (creatorEmail) {
    lines.push(`  creator_email: "${creatorEmail}"`)
  }
  return lines.join('\n')
}
