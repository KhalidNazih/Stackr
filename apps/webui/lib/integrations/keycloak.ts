import { keycloakConfig, apiConfig } from '@/lib/config'

export interface KeycloakUser {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  enabled: boolean
  emailVerified: boolean
  realmRoles: string[]
}

export function isKeycloakConfigured(): boolean {
  return Boolean(keycloakConfig.url)
}

export function buildAuthorizeUrl(redirectUri: string, state?: string): string {
  if (!keycloakConfig.url) return '#'
  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    ...(state ? { state } : {}),
  })
  return `${keycloakConfig.loginUrl}?${params.toString()}`
}

export async function searchKeycloakUsers(query: string, limit = 20): Promise<KeycloakUser[]> {
  const res = await fetch(`${apiConfig.url}/api/keycloak/users?search=${encodeURIComponent(query)}&limit=${limit}`)
  if (!res.ok) throw new Error(`Keycloak user search failed: ${res.statusText}`)
  return res.json()
}

export async function getKeycloakUser(id: string): Promise<KeycloakUser | null> {
  const res = await fetch(`${apiConfig.url}/api/keycloak/users/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Keycloak get user failed: ${res.statusText}`)
  return res.json()
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  access_token: string
  refresh_token: string
  id_token: string
  expires_in: number
}> {
  const res = await fetch(`${apiConfig.url}/api/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${res.statusText}`)
  return res.json()
}

export async function provisionKeycloakTenant(tenantId: string, displayName: string): Promise<{ created_groups: string[] }> {
  const res = await fetch(`${apiConfig.url}/api/keycloak/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: tenantId, display_name: displayName }),
  })
  if (!res.ok) throw new Error(`Keycloak tenant provision failed: ${res.statusText}`)
  return res.json()
}

export async function deprovisionKeycloakTenant(tenantId: string): Promise<void> {
  const res = await fetch(`${apiConfig.url}/api/keycloak/tenants/${tenantId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Keycloak tenant deprovision failed: ${res.statusText}`)
}
