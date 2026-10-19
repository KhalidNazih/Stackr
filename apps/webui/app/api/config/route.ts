import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || '',
    appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'production',
    keycloakUrl: process.env.KEYCLOAK_URL || process.env.NEXT_PUBLIC_KEYCLOAK_URL || '',
    keycloakRealm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Devsecops_Platform_Users',
    keycloakClientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'stackr-plus',
    gitlabUrl: process.env.NEXT_PUBLIC_GITLAB_URL || '',
    argocdUrl: process.env.NEXT_PUBLIC_ARGOCD_URL || '',
    clusterBaseUrl: process.env.NEXT_PUBLIC_CLUSTER_BASE_URL || '',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '/backend',
  })
}
