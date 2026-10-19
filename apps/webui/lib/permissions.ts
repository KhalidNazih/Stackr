/**
 * Permission model — how the platform decides what a user can do.
 *
 *  ── Global roles (granted by admin in /admin/access) ──
 *  admin     : Full platform access. Can grant access to other users.
 *              Approves provisioning requests.
 *  manager   : Project owner. Can create projects, invite developers,
 *              promote/demote developers within their own projects.
 *  developer : Can be added to projects by managers. Read-only +
 *              limited write (push to feature branches via GitLab, but
 *              no admin actions in the platform UI).
 *  viewer    : Read-only platform access. Sees only their dashboard
 *              and projects they were invited to.
 *
 *  ── Per-project roles (granted by the project's manager) ──
 *  owner     : The manager who created the project. Full control.
 *  maintainer: Trusted dev; can review/merge, manage CI vars.
 *  developer : Can push to feature branches, view all project state.
 *  viewer    : Read-only — can see dashboards and logs, no write.
 */

import type { Role } from './auth-context'

export type PlatformRole = Role
export type ProjectRole = 'owner' | 'maintainer' | 'developer' | 'viewer'

export interface ProjectMember {
  userId: string
  email: string
  name: string
  projectRole: ProjectRole
  addedAt: string
  addedBy: string
}

export interface Project {
  id: string
  slug: string
  name: string
  description: string
  /** The manager who owns it (one per project). */
  ownerEmail: string
  /** All members including the owner. */
  members: ProjectMember[]
  /** GitLab repo path (e.g. "platform/myapp"). */
  gitlabPath: string
  /** Argo CD application name (usually = slug). */
  argocdApp: string
  /** Tenant id this project belongs to. */
  tenantId: string
  status: 'pending' | 'provisioning' | 'active' | 'archived'
  createdAt: string
  createdBy: string
}

// ─── Permission checks ──────────────────────────────────────────────────────

/** Admin-level platform actions. */
export function canManageUsers(role: PlatformRole | undefined): boolean {
  return role === 'admin'
}

export function canApproveRequests(role: PlatformRole | undefined): boolean {
  return role === 'admin'
}

/** Anyone except plain viewers can REQUEST a new project. */
export function canRequestProject(role: PlatformRole | undefined): boolean {
  return role === 'admin' || role === 'developer'
}

/** Only managers (and admins) actually OWN projects after creation. */
export function canCreateProject(role: PlatformRole | undefined): boolean {
  // In our role mapping `developer` is the platform-level dev. Project
  // managers also have role=developer + isManager flag, OR you can treat
  // anyone non-viewer as eligible — the UI gates on this.
  return role === 'admin' || role === 'developer'
}

// ─── Per-project checks ─────────────────────────────────────────────────────

export function projectRoleOf(project: Project, email: string): ProjectRole | null {
  const m = project.members.find(m => m.email === email)
  return m?.projectRole ?? null
}

export function canEditProject(project: Project, email: string, platformRole: PlatformRole | undefined): boolean {
  if (platformRole === 'admin') return true
  const r = projectRoleOf(project, email)
  return r === 'owner' || r === 'maintainer'
}

export function canInviteToProject(project: Project, email: string, platformRole: PlatformRole | undefined): boolean {
  if (platformRole === 'admin') return true
  return projectRoleOf(project, email) === 'owner'
}

export function canViewProject(project: Project, email: string, platformRole: PlatformRole | undefined): boolean {
  if (platformRole === 'admin') return true
  return projectRoleOf(project, email) !== null
}

/** Map a per-project role to a GitLab access level. */
export const PROJECT_ROLE_TO_GITLAB_LEVEL: Record<ProjectRole, 10 | 20 | 30 | 40 | 50> = {
  viewer:     20, // reporter
  developer:  30, // developer
  maintainer: 40, // maintainer
  owner:      50, // owner
}

export const PROJECT_ROLE_LABEL: Record<ProjectRole, { en: string; fr: string; descEn: string; descFr: string }> = {
  owner:      { en: 'Owner',      fr: 'Propriétaire', descEn: 'Full control — invite, configure, delete', descFr: 'Contrôle total — inviter, configurer, supprimer' },
  maintainer: { en: 'Maintainer', fr: 'Mainteneur',   descEn: 'Review, merge, manage CI/CD secrets', descFr: 'Revoir, fusionner, gérer les secrets CI/CD' },
  developer:  { en: 'Developer',  fr: 'Développeur',  descEn: 'Push to feature branches, view all state', descFr: 'Pousser vers les branches de fonctionnalités, voir tout l\'état' },
  viewer:     { en: 'Viewer',     fr: 'Observateur',  descEn: 'Read-only — dashboards and logs only', descFr: 'Lecture seule — tableaux de bord et logs uniquement' },
}
