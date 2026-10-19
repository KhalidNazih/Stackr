import { apiConfig } from '@/lib/config'

export interface GitLabProject {
  id: number
  name: string
  path: string
  pathWithNamespace: string
  webUrl: string
  sshUrlToRepo: string
  httpUrlToRepo: string
  defaultBranch: string
  visibility: 'private' | 'internal' | 'public'
  createdAt: string
}

export interface GitLabMember {
  id: number
  username: string
  email: string
  accessLevel: 10 | 20 | 30 | 40 | 50
}

export interface TenantManifest {
  tenant_id: string
  manifest: Record<string, unknown>
}

export function isGitLabConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GITLAB_URL)
}

export async function createProject(input: {
  name: string
  slug: string
  description: string
  visibility?: 'private' | 'internal'
  initializeReadme?: boolean
}): Promise<GitLabProject> {
  const res = await fetch(`${apiConfig.url}/api/gitlab/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Create GitLab project failed: ${res.statusText}`)
  return res.json()
}

export async function addProjectMember(projectId: number, username: string, accessLevel: GitLabMember['accessLevel']): Promise<GitLabMember> {
  const res = await fetch(`${apiConfig.url}/api/gitlab/projects/${projectId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, access_level: accessLevel }),
  })
  if (!res.ok) throw new Error(`Add GitLab member failed: ${res.statusText}`)
  return res.json()
}

export async function removeProjectMember(projectId: number, username: string): Promise<void> {
  const res = await fetch(`${apiConfig.url}/api/gitlab/projects/${projectId}/members/${username}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Remove GitLab member failed: ${res.statusText}`)
}

export async function listProjectMembers(projectId: number): Promise<GitLabMember[]> {
  const res = await fetch(`${apiConfig.url}/api/gitlab/projects/${projectId}/members`)
  if (!res.ok) throw new Error(`List GitLab members failed: ${res.statusText}`)
  return res.json()
}

export async function commitFile(input: {
  branch: string
  filePath: string
  content: string
  commitMessage: string
}): Promise<{ commitSha: string }> {
  const res = await fetch(`${apiConfig.url}/api/gitlab/commits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      branch: input.branch,
      file_path: input.filePath,
      content: input.content,
      commit_message: input.commitMessage,
    }),
  })
  if (!res.ok) throw new Error(`Commit file failed: ${res.statusText}`)
  return res.json()
}

export async function listTenantManifests(): Promise<TenantManifest[]> {
  const res = await fetch(`${apiConfig.url}/api/gitlab/registry`)
  if (!res.ok) throw new Error(`List tenant manifests failed: ${res.statusText}`)
  return res.json()
}

export async function getTenantManifest(tenantId: string): Promise<TenantManifest> {
  const res = await fetch(`${apiConfig.url}/api/gitlab/registry/${tenantId}`)
  if (!res.ok) throw new Error(`Get tenant manifest failed: ${res.statusText}`)
  return res.json()
}

export async function commitTenantManifest(tenantId: string, manifest: Record<string, unknown>): Promise<{ tenant_id: string }> {
  const res = await fetch(`${apiConfig.url}/api/gitlab/registry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: tenantId, manifest }),
  })
  if (!res.ok) throw new Error(`Commit tenant manifest failed: ${res.statusText}`)
  return res.json()
}

export async function deleteTenantManifest(tenantId: string): Promise<void> {
  const res = await fetch(`${apiConfig.url}/api/gitlab/registry/${tenantId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Delete tenant manifest failed: ${res.statusText}`)
}
