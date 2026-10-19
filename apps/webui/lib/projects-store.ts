'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Project, ProjectMember, ProjectRole } from './permissions'
import { apiConfig } from './config'

function mapApiProject(p: Record<string, unknown>): Project {
  return {
    id: p.id as string,
    slug: ((p.name as string) ?? '').toLowerCase().replace(/\s+/g, '-'),
    name: p.name as string,
    description: (p.description as string) ?? '',
    ownerEmail: (p.owner_email as string) ?? '',
    tenantId: (p.tenant_id as string) ?? '',
    gitlabPath: (p.gitlab_path as string) ?? '',
    argocdApp: (p.argocd_app as string) ?? '',
    status: ((p.status as string) ?? 'active') as 'pending' | 'active' | 'provisioning' | 'archived',
    createdAt: (p.created_at as string) ?? new Date().toISOString(),
    createdBy: (p.created_by as string) ?? '',
    members: (p.members as ProjectMember[]) ?? [],
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${apiConfig.url}/api/projects`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.map(mapApiProject))
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (input: {
    name: string; slug: string; description: string; tenantId: string;
    ownerEmail: string; ownerName: string; createdBy: string;
  }): Promise<Project> => {
    const res = await fetch(`${apiConfig.url}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name,
        description: input.description,
      }),
    })
    if (!res.ok) throw new Error(`Create project failed: ${res.statusText}`)
    const created = await res.json()
    const project = mapApiProject(created)
    setProjects(prev => [project, ...prev])
    return project
  }, [])

  const addMember = useCallback(async (projectId: string, member: Omit<ProjectMember, 'addedAt'>): Promise<void> => {
    const res = await fetch(`${apiConfig.url}/api/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: member.userId, role: member.projectRole }),
    })
    if (res.ok) await load()
  }, [load])

  const removeMember = useCallback(async (projectId: string, email: string): Promise<void> => {
    const project = projects.find(p => p.id === projectId)
    const member = project?.members.find(m => m.email === email)
    if (!member?.userId) return
    const res = await fetch(`${apiConfig.url}/api/projects/${projectId}/members/${member.userId}`, {
      method: 'DELETE',
    })
    if (res.ok) setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, members: p.members.filter(m => m.email !== email) } : p
    ))
  }, [projects])

  const updateMemberRole = useCallback(async (projectId: string, email: string, projectRole: ProjectRole): Promise<void> => {
    const project = projects.find(p => p.id === projectId)
    const member = project?.members.find(m => m.email === email)
    if (!member?.userId) return
    // remove then re-add with new role
    await fetch(`${apiConfig.url}/api/projects/${projectId}/members/${member.userId}`, { method: 'DELETE' })
    await fetch(`${apiConfig.url}/api/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: member.userId, role: projectRole }),
    })
    await load()
  }, [projects, load])

  return { projects, loaded, create, addMember, removeMember, updateMemberRole }
}
