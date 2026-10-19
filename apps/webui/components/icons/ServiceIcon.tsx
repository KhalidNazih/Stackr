import {
  SiGitlab, SiJenkins, SiSonarqubeserver, SiSonatype,
  SiPostgresql, SiRedis, SiFastapi, SiArgo, SiKubernetes, SiKeycloak
} from 'react-icons/si'
import { Box, Lock } from 'lucide-react'
import type { IconType } from 'react-icons'

export interface ServiceMeta {
  id: string
  name: string
  Icon: IconType | React.FC<any>
  color: string       // brand hex
  bg: string          // tailwind bg class
  ring: string        // tailwind ring/border class
}

export const SERVICE_META: Record<string, ServiceMeta> = {
  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    Icon: SiGitlab,
    color: '#FC6D26',
    bg: 'bg-[#FFF3EC]',
    ring: 'ring-[#FC6D26]/20',
  },
  jenkins: {
    id: 'jenkins',
    name: 'Jenkins',
    Icon: SiJenkins,
    color: '#D24939',
    bg: 'bg-[#FEF0EF]',
    ring: 'ring-[#D24939]/20',
  },
  nexus: {
    id: 'nexus',
    name: 'Nexus',
    Icon: SiSonatype,
    color: '#1B1C30',
    bg: 'bg-[#EEEEF5]',
    ring: 'ring-[#1B1C30]/15',
  },
  sonarqube: {
    id: 'sonarqube',
    name: 'SonarQube',
    Icon: SiSonarqubeserver,
    color: '#4E9BCD',
    bg: 'bg-[#EFF6FC]',
    ring: 'ring-[#4E9BCD]/20',
  },
  openbao: {
    id: 'openbao',
    name: 'OpenBao',
    Icon: Lock,
    color: '#FF6F00',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    ring: 'ring-amber-500/20',
  },
  postgresql: {
    id: 'postgresql',
    name: 'PostgreSQL',
    Icon: SiPostgresql,
    color: '#336791',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    ring: 'ring-blue-500/20',
  },
  redis: {
    id: 'redis',
    name: 'Redis',
    Icon: SiRedis,
    color: '#DC382D',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    ring: 'ring-rose-500/20',
  },
  fastapi: {
    id: 'fastapi',
    name: 'FastAPI',
    Icon: SiFastapi,
    color: '#059669',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    ring: 'ring-emerald-500/20',
  },
  argocd: {
    id: 'argocd',
    name: 'ArgoCD',
    Icon: SiArgo,
    color: '#EF305E',
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    ring: 'ring-pink-500/20',
  },
  kubernetes: {
    id: 'kubernetes',
    name: 'Kubernetes',
    Icon: SiKubernetes,
    color: '#326CE5',
    bg: 'bg-sky-50 dark:bg-sky-950/20',
    ring: 'ring-sky-500/20',
  },
  keycloak: {
    id: 'keycloak',
    name: 'Keycloak',
    Icon: SiKeycloak,
    color: '#0088CE',
    bg: 'bg-sky-50 dark:bg-sky-950/20',
    ring: 'ring-sky-500/20',
  },
  'kube-system': {
    id: 'kube-system',
    name: 'Kube System',
    Icon: SiKubernetes,
    color: '#326CE5',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    ring: 'ring-indigo-500/20',
  },
  default: {
    id: 'default',
    name: 'Service',
    Icon: Box as any,
    color: '#64748B',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    ring: 'ring-slate-500/20',
  }
}

interface ServiceIconProps {
  service: string
  size?: number
  containerSize?: string
  showRing?: boolean
}

export function ServiceIcon({
  service,
  size = 20,
  containerSize = 'w-10 h-10',
  showRing = false,
}: ServiceIconProps) {
  const sLower = (service || '').toLowerCase()
  // Try to match specific known prefixes, otherwise use default
  let matchedKey = 'default'
  if (sLower.includes('gitlab')) matchedKey = 'gitlab'
  else if (sLower.includes('jenkins')) matchedKey = 'jenkins'
  else if (sLower.includes('nexus')) matchedKey = 'nexus'
  else if (sLower.includes('sonar')) matchedKey = 'sonarqube'
  else if (sLower.includes('openbao') || sLower.includes('vault') || sLower.includes('bao')) matchedKey = 'openbao'
  else if (sLower.includes('postgres')) matchedKey = 'postgresql'
  else if (sLower.includes('redis')) matchedKey = 'redis'
  else if (sLower.includes('fastapi') || sLower.includes('backend') || sLower.includes('api')) matchedKey = 'fastapi'
  else if (sLower.includes('argocd') || sLower.includes('argo')) matchedKey = 'argocd'
  else if (sLower.includes('keycloak')) matchedKey = 'keycloak'
  else if (sLower.includes('kube-system')) matchedKey = 'kube-system'
  else if (sLower.includes('kubernetes') || sLower.includes('kube') || sLower.includes('k8s')) matchedKey = 'kubernetes'
  
  const meta = SERVICE_META[matchedKey]

  const { Icon, color, bg, ring } = meta

  return (
    <div
      className={`${containerSize} ${bg} ${showRing ? `ring-1 ${ring}` : ''} flex items-center justify-center rounded-xl flex-shrink-0`}
    >
      <Icon size={size} style={{ color }} />
    </div>
  )
}

export function ServiceIconInline({ service, size = 16 }: { service: string; size?: number }) {
  const sLower = (service || '').toLowerCase()
  let matchedKey = 'default'
  if (sLower.includes('gitlab')) matchedKey = 'gitlab'
  else if (sLower.includes('jenkins')) matchedKey = 'jenkins'
  else if (sLower.includes('nexus')) matchedKey = 'nexus'
  else if (sLower.includes('sonar')) matchedKey = 'sonarqube'
  else if (sLower.includes('openbao') || sLower.includes('vault') || sLower.includes('bao')) matchedKey = 'openbao'
  else if (sLower.includes('postgres')) matchedKey = 'postgresql'
  else if (sLower.includes('redis')) matchedKey = 'redis'
  else if (sLower.includes('fastapi') || sLower.includes('backend') || sLower.includes('api')) matchedKey = 'fastapi'
  else if (sLower.includes('argocd') || sLower.includes('argo')) matchedKey = 'argocd'
  else if (sLower.includes('keycloak')) matchedKey = 'keycloak'
  else if (sLower.includes('kube-system')) matchedKey = 'kube-system'
  else if (sLower.includes('kubernetes') || sLower.includes('kube') || sLower.includes('k8s')) matchedKey = 'kubernetes'
  
  const meta = SERVICE_META[matchedKey]
  return <meta.Icon size={size} style={{ color: meta.color }} />
}
