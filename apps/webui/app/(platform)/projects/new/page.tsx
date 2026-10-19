'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FolderGit2, GitBranch, CheckCircle2, AlertCircle, ArrowLeft, Layers,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { useProjects } from '@/lib/projects-store'
import { usePlatformUsers } from '@/lib/platform-users-store'
import { canCreateProject } from '@/lib/permissions'
import { TENANTS } from '@/lib/mock-data'

import { useT } from '@/lib/i18n/i18n-context'

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export default function NewProjectPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { create } = useProjects()
  const { users } = usePlatformUsers()
  const { t, locale } = useT()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tenantId, setTenantId] = useState(TENANTS[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!user) return null
  const platformUser = users.find(u => u.email === user.email)
  const canCreate = canCreateProject(user.role) && (platformUser?.canManageProjects ?? user.role === 'admin')

  if (!canCreate) {
    return (
      <Card className="py-16 text-center">
        <FolderGit2 size={32} className="mx-auto mb-3 text-rose-400" />
        <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{t('newProject.permissionRequired')}</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('newProject.permissionRequiredDesc')}
        </p>
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="md" asChild>
            <Link href="/projects"><ArrowLeft size={13} /> {t('newProject.backToProjects')}</Link>
          </Button>
        </div>
      </Card>
    )
  }

  const slug = slugify(name)

  const submit = async () => {
    setError(null)
    if (!name.trim() || !slug) return setError(t('newProject.errorName'))
    if (!tenantId) return setError(t('newProject.errorTenant'))
    setSubmitting(true)
    try {
      const project = await create({
        name: name.trim(),
        slug,
        description: description.trim() || (locale === 'fr' ? 'Aucune description fournie.' : 'No description provided.'),
        tenantId,
        ownerEmail: user.email,
        ownerName: user.name,
        createdBy: user.email,
      })
      router.push(`/projects/${project.id}`)
    } catch {
      setError(t('newProject.errorCreate'))
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/projects"><ArrowLeft size={12} /> {t('nav.projects')}</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('newProject.title')}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('newProject.desc')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderGit2 size={16} className="text-[#0078D4]" />
            {t('newProject.details')}
          </CardTitle>
          <CardDescription>{t('newProject.detailsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('newProject.nameLabel')}</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Customer portal API"
              className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
            />
            {slug && (
              <p className="mt-1.5 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                GitLab path: <span className="text-[#0078D4]">platform/{slug}</span>
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('newProject.descLabel')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder={t('newProject.descPlaceholder')}
              className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15 resize-none"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t('newProject.tenantLabel')}</label>
            <select
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-[13px]"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
            >
              {TENANTS.map(t => <option key={t.id} value={t.id}>{t.displayName} · {t.envType}</option>)}
            </select>
          </div>

          {/* What will be created */}
          <div className="rounded-lg border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              {t('newProject.onCreation')}
            </p>
            <ul className="space-y-1.5 text-[12px]">
              <li className="flex items-center gap-2"><GitBranch size={11} className="text-[#0078D4]" /> {t('newProject.provisionGitLab')} <code className="font-mono text-[#0078D4]">platform/{slug || 'name'}</code></li>
              <li className="flex items-center gap-2"><Layers size={11} className="text-[#0078D4]" /> {t('newProject.provisionArgo')} <code className="font-mono text-[#0078D4]">{slug || 'name'}</code></li>
              <li className="flex items-center gap-2"><CheckCircle2 size={11} className="text-[#0078D4]" /> {t('newProject.provisionOwner')}</li>
            </ul>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-[12px] text-rose-700 dark:text-rose-400">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="md" asChild>
              <Link href="/projects">{t('common.cancel')}</Link>
            </Button>
            <Button variant="primary" size="md" onClick={submit} disabled={submitting}>
              {submitting ? t('newProject.creating') : <><FolderGit2 size={13} /> {t('newProject.createBtn')}</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
