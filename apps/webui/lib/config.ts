/**
 * Central configuration — reads from environment variables.
 *
 * IMPORTANT: NEXT_PUBLIC_* vars must be accessed as literal `process.env.NEXT_PUBLIC_FOO`
 * expressions so Next.js can statically replace them in the client bundle.
 * Dynamic access like `process.env[key]` is NOT replaced and reads as undefined in the browser.
 *
 * NEXT_PUBLIC_ vars   → available in browser + server (literal access only)
 * Non-prefixed vars   → server-side only (API routes, server components)
 */

function clean(val: string | undefined, fallback = ''): string {
  return (val ?? fallback).trim().replace(/\s+#.*$/, '').trim()
}

function stripSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

// ─── App ─────────────────────────────────────────────────────────────────────
export const appConfig = {
  url: stripSlash(clean(process.env.NEXT_PUBLIC_APP_URL, '')),
  env: clean(process.env.NEXT_PUBLIC_APP_ENV, 'development'),
  isProd: clean(process.env.NEXT_PUBLIC_APP_ENV) === 'production',
} as const

// ─── Keycloak ────────────────────────────────────────────────────────────────
export const keycloakConfig = {
  url: stripSlash(clean(process.env.NEXT_PUBLIC_KEYCLOAK_URL)),
  realm: clean(process.env.NEXT_PUBLIC_KEYCLOAK_REALM, 'Devsecops_Platform_Users'),
  clientId: clean(process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID, 'stackr-plus'),
  /** Server-side only — never sent to browser */
  clientSecret: clean(process.env.KEYCLOAK_CLIENT_SECRET),
  get loginUrl() {
    if (!this.url) return '#'
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/auth`
  },
  get tokenUrl() {
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/token`
  },
  get userInfoUrl() {
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/userinfo`
  },
  get adminUrl() {
    return `${this.url}/admin/realms/${this.realm}`
  },
} as const

// ─── GitLab (Source of Truth) ────────────────────────────────────────────────
export const gitlabConfig = {
  url: clean(process.env.NEXT_PUBLIC_GITLAB_URL),
  /** Server-side only */
  token: clean(process.env.GITLAB_TOKEN),
  namespace: clean(process.env.GITLAB_NAMESPACE, 'platform'),
  projectId: clean(process.env.GITLAB_PROJECT_ID),
  tenantRepo: clean(process.env.GITLAB_TENANT_REPO, 'platform-gitops'),
  get apiUrl() { return this.url ? `${this.url}/api/v4` : '' },
  get tenantRepoUrl() { return this.url ? `${this.url}/${this.namespace}/${this.tenantRepo}` : '' },
} as const

// ─── Argo CD ─────────────────────────────────────────────────────────────────
export const argocdConfig = {
  url: clean(process.env.NEXT_PUBLIC_ARGOCD_URL),
  /** Server-side only */
  token: clean(process.env.ARGOCD_TOKEN),
  get apiUrl() { return this.url ? `${this.url}/api/v1` : '' },
} as const

// ─── Kubernetes ──────────────────────────────────────────────────────────────
export const kubeConfig = {
  apiUrl: clean(process.env.KUBE_API_URL),
  /** Server-side only */
  token: clean(process.env.KUBE_TOKEN),
  namespace: clean(process.env.KUBE_NAMESPACE, 'admin'),
} as const

// ─── Platform Services ────────────────────────────────────────────────────────
export const servicesConfig = {
  gitlab:     { url: clean(process.env.NEXT_PUBLIC_GITLAB_SERVICE_URL),  name: 'GitLab',     id: 'gitlab'     },
  jenkins:    { url: clean(process.env.NEXT_PUBLIC_JENKINS_URL),          name: 'Jenkins',    id: 'jenkins'    },
  nexus:      { url: clean(process.env.NEXT_PUBLIC_NEXUS_URL),            name: 'Nexus',      id: 'nexus'      },
  sonarqube:  { url: clean(process.env.NEXT_PUBLIC_SONARQUBE_URL),        name: 'SonarQube',  id: 'sonarqube'  },
} as const

// ─── FastAPI Backend ──────────────────────────────────────────────────────────
export const apiConfig = {
  /** Browser-side URL — goes through Next.js /backend proxy rewrite */
  url: stripSlash(clean(process.env.NEXT_PUBLIC_API_URL, '/backend')),
  /** Server-side only — direct cluster URL, never sent to browser */
  backendUrl: stripSlash(clean(process.env.BACKEND_URL, clean(process.env.NEXT_PUBLIC_API_URL, ''))),
  secretKey: clean(process.env.API_SECRET_KEY),
} as const

// ─── Database / Redis (backend — documented for reference) ───────────────────
export const infraConfig = {
  databaseUrl: clean(process.env.DATABASE_URL),
  redisUrl: clean(process.env.REDIS_URL),
} as const

// ─── OpenBao / Vault ─────────────────────────────────────────────────────────
export const vaultConfig = {
  url: clean(process.env.VAULT_URL),
  /** Server-side only */
  token: clean(process.env.VAULT_TOKEN),
  mount: clean(process.env.VAULT_MOUNT, 'secret'),
  get apiUrl() { return this.url ? `${this.url}/v1` : '' },
} as const

// ─── Master config export ────────────────────────────────────────────────────
export const config = {
  app: appConfig,
  keycloak: keycloakConfig,
  gitlab: gitlabConfig,
  argocd: argocdConfig,
  kube: kubeConfig,
  services: servicesConfig,
  api: apiConfig,
  infra: infraConfig,
  vault: vaultConfig,
} as const

export default config
