'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FolderGit2, ArrowLeft, UserPlus, Trash2, GitBranch, ExternalLink,
  Crown, Wrench, Code2, Eye, AlertCircle, Layers, Mail,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { useProjects } from '@/lib/projects-store'
import { usePlatformUsers } from '@/lib/platform-users-store'
import {
  canInviteToProject, canViewProject, projectRoleOf,
  PROJECT_ROLE_LABEL, type ProjectRole,
} from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/i18n-context'

const ROLE_ICONS: Record<ProjectRole, typeof Crown> = {
  owner: Crown,
  maintainer: Wrench,
  developer: Code2,
  viewer: Eye,
}

const ROLE_COLOR: Record<ProjectRole, string> = {
  owner:      'text-amber-500',
  maintainer: 'text-violet-500',
  developer:  'text-sky-500',
  viewer:     'text-gray-500',
}

export default function ProjectDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { projects, addMember, removeMember, updateMemberRole } = useProjects()
  const { users } = usePlatformUsers()
  const [showInvite, setShowInvite] = useState(false)
  const { t, locale } = useT()

  const project = projects.find(p => p.id === id)
  if (!user) return null

  if (!project) {
    return (
      <Card className="py-16 text-center">
        <FolderGit2 size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('projectDetail.notFound')}</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{t('projectDetail.notFoundDesc')}</p>
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="md" asChild><Link href="/projects"><ArrowLeft size={13} /> {t('projectDetail.back')}</Link></Button>
        </div>
      </Card>
    )
  }

  if (!canViewProject(project, user.email, user.role)) {
    return (
      <Card className="py-16 text-center">
        <AlertCircle size={32} className="mx-auto mb-3 text-rose-400" />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('access.denied')}</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{locale === 'fr' ? "Vous n'êtes pas membre de ce projet." : "You are not a member of this project."}</p>
      </Card>
    )
  }

  const myRole = projectRoleOf(project, user.email)
  const canInvite = canInviteToProject(project, user.email, user.role)
  const isReadOnly = myRole === 'viewer' || myRole === 'developer'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/projects"><ArrowLeft size={12} /> {t('nav.projects')}</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0078D4] to-[#106EBE] shadow-lg">
            <FolderGit2 size={22} className="text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
              <Badge variant={project.status === 'active' ? 'success' : project.status === 'provisioning' ? 'warning' : 'default'} size="sm" dot>
                {project.status}
              </Badge>
              {myRole && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0078D4]">
                  {t('projects.yourRole')}: {myRole === 'owner' ? t('projects.ownerStar') : (locale === 'fr' ? PROJECT_ROLE_LABEL[myRole].fr : PROJECT_ROLE_LABEL[myRole].en)}
                </span>
              )}
            </div>
            <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--text-muted)' }}>{project.description}</p>
            <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>{project.gitlabPath}</p>
          </div>
        </div>
      </div>

      {/* Resource cards */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { icon: GitBranch, label: locale === 'fr' ? 'Dépôt GitLab' : 'GitLab repo',     value: project.gitlabPath,  hint: locale === 'fr' ? 'branche main' : 'main branch' },
          { icon: Layers,    label: locale === 'fr' ? 'App Argo CD' : 'Argo CD app',     value: project.argocdApp,    hint: locale === 'fr' ? 'sync automatique' : 'auto-sync' },
          { icon: FolderGit2, label: 'Tenant',         value: project.tenantId,     hint: locale === 'fr' ? 'espace de noms' : 'namespace' },
        ].map(r => {
          const I = r.icon
          return (
            <Card key={r.label} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0078D4]/10">
                  <I size={13} className="text-[#0078D4]" strokeWidth={2.2} />
                </div>
                <button className="text-gray-400 hover:text-[#0078D4]"><ExternalLink size={12} /></button>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{r.label}</p>
              <p className="text-sm font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>{r.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.hint}</p>
            </Card>
          )
        })}
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('projectDetail.teamMembers')}</CardTitle>
            <CardDescription>
              {canInvite
                ? t('projectDetail.teamMembersDescAdmin')
                : t('projectDetail.teamMembersDescUser')}
            </CardDescription>
          </div>
          {canInvite && (
            <Button variant="primary" size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={12} /> {t('projectDetail.inviteDev')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showInvite && (
            <InviteForm
              onCancel={() => setShowInvite(false)}
              onSubmit={(m) => { addMember(project.id, m); setShowInvite(false) }}
              existingEmails={project.members.map(m => m.email)}
              availableUsers={users.filter(u => !project.members.some(m => m.email === u.email))}
              inviterEmail={user.email}
            />
          )}

          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {project.members.map(m => {
              const RoleI = ROLE_ICONS[m.projectRole]
              const isMe = m.email === user.email
              const initials = m.name.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()

              return (
                <div key={m.email} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0078D4] to-[#106EBE] text-[11px] font-bold text-white shadow-sm">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                      {isMe && <span className="text-[10px] uppercase tracking-wider text-[#0078D4]">{locale === 'fr' ? 'vous' : 'you'}</span>}
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.email}</p>
                  </div>

                  <div className="flex items-center gap-1.5 mr-2">
                    <RoleI size={12} className={ROLE_COLOR[m.projectRole]} strokeWidth={2.5} />
                    {canInvite && m.projectRole !== 'owner' && !isMe ? (
                      <select
                        value={m.projectRole}
                        onChange={e => updateMemberRole(project.id, m.email, e.target.value as ProjectRole)}
                        className="rounded-md border px-2 py-1 text-[11px] font-medium"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      >
                        <option value="maintainer">{locale === 'fr' ? PROJECT_ROLE_LABEL.maintainer.fr : PROJECT_ROLE_LABEL.maintainer.en}</option>
                        <option value="developer">{locale === 'fr' ? PROJECT_ROLE_LABEL.developer.fr : PROJECT_ROLE_LABEL.developer.en}</option>
                        <option value="viewer">{locale === 'fr' ? PROJECT_ROLE_LABEL.viewer.fr : PROJECT_ROLE_LABEL.viewer.en}</option>
                      </select>
                    ) : (
                      <span className="text-[11px] font-semibold capitalize" style={{ color: 'var(--text-secondary)' }}>
                        {locale === 'fr' ? PROJECT_ROLE_LABEL[m.projectRole].fr : PROJECT_ROLE_LABEL[m.projectRole].en}
                      </span>
                    )}
                  </div>

                  {canInvite && !isMe && m.projectRole !== 'owner' && (
                    <button
                      onClick={() => {
                        if (confirm(t('projectDetail.removeConfirm').replace('{email}', m.email))) {
                          removeMember(project.id, m.email)
                        }
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600"
                      title={t('projectDetail.removeMember')}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Role legend */}
          <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{t('projectDetail.rolePermissions')}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(['owner','maintainer','developer','viewer'] as ProjectRole[]).map(r => {
                const I = ROLE_ICONS[r]
                return (
                  <div key={r} className="rounded-lg border px-3 py-2.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <I size={11} className={ROLE_COLOR[r]} strokeWidth={2.5} />
                      <p className="text-[11px] font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{locale === 'fr' ? PROJECT_ROLE_LABEL[r].fr : PROJECT_ROLE_LABEL[r].en}</p>
                    </div>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{locale === 'fr' ? PROJECT_ROLE_LABEL[r].descFr : PROJECT_ROLE_LABEL[r].descEn}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Invite form ─────────────────────────────────────────────────── */
function InviteForm({ onCancel, onSubmit, existingEmails, availableUsers, inviterEmail }: {
  onCancel: () => void
  onSubmit: (m: { userId: string; email: string; name: string; projectRole: ProjectRole; addedBy: string }) => void
  existingEmails: string[]
  availableUsers: { email: string; name: string }[]
  inviterEmail: string
}) {
  const { t, locale } = useT()
  const [email, setEmail] = useState(availableUsers[0]?.email ?? '')
  const [role, setRole] = useState<ProjectRole>('developer')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    setError(null)
    if (!email) return setError(t('projectDetail.errorPickUser'))
    if (existingEmails.includes(email)) return setError(t('projectDetail.errorAlreadyMember'))
    const selected = availableUsers.find(u => u.email === email)
    if (!selected) return setError(t('projectDetail.errorUnknownUser'))
    onSubmit({
      userId: selected.email,
      email: selected.email,
      name: selected.name,
      projectRole: role,
      addedBy: inviterEmail,
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg border p-4 space-y-3"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <p className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t('projectDetail.inviteTitle')}</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
        <select
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="rounded-lg border px-3 py-2 text-[13px]"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
        >
          {availableUsers.length === 0
            ? <option value="">{t('projectDetail.noUsersAvailable')}</option>
            : availableUsers.map(u => <option key={u.email} value={u.email}>{u.name} — {u.email}</option>)}
        </select>
        <select
          value={role}
          onChange={e => setRole(e.target.value as ProjectRole)}
          className="rounded-lg border px-3 py-2 text-[13px]"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
        >
          <option value="maintainer">{locale === 'fr' ? PROJECT_ROLE_LABEL.maintainer.fr : PROJECT_ROLE_LABEL.maintainer.en}</option>
          <option value="developer">{locale === 'fr' ? PROJECT_ROLE_LABEL.developer.fr : PROJECT_ROLE_LABEL.developer.en}</option>
          <option value="viewer">{locale === 'fr' ? PROJECT_ROLE_LABEL.viewer.fr : PROJECT_ROLE_LABEL.viewer.en}</option>
        </select>
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button variant="primary" size="md" onClick={submit} disabled={availableUsers.length === 0}>{t('projectDetail.invite')}</Button>
        </div>
      </div>
      {error && <p className="text-[11px] text-rose-600 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
    </motion.div>
  )
}
