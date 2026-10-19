'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus, FolderGit2, GitBranch, Users as UsersIcon, ChevronRight, Lock, Search,
} from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { useProjects } from '@/lib/projects-store'
import { usePlatformUsers } from '@/lib/platform-users-store'
import { canCreateProject } from '@/lib/permissions'
import { useT } from '@/lib/i18n/i18n-context'

export default function ProjectsPage() {
  const { user } = useAuth()
  const { projects, loaded } = useProjects()
  const { users } = usePlatformUsers()
  const [query, setQuery] = useState('')
  const { t } = useT()

  if (!user) return null

  const platformUser = users.find(u => u.email === user.email)
  const canCreate = canCreateProject(user.role) && (platformUser?.canManageProjects ?? user.role === 'admin')

  const visible = projects.filter(p => {
    // Admins see all. Others see only projects they're members of.
    if (user.role === 'admin') return true
    return p.members.some(m => m.email === user.email)
  }).filter(p =>
    !query.trim()
    || p.name.toLowerCase().includes(query.toLowerCase())
    || p.description.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('projects.title')}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {user.role === 'admin'
              ? t('projects.subtitleAdmin')
              : t('projects.subtitleUser')}
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="md" asChild>
            <Link href="/projects/new"><Plus size={13} /> {t('projects.newProject')}</Link>
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          placeholder={t('projects.searchPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
        />
      </div>

      {loaded && visible.length === 0 ? (
        <Card className="py-16 text-center">
          <FolderGit2 size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('projects.noProjects')}</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {canCreate
              ? t('projects.noProjectsDescAdmin')
              : t('projects.noProjectsDescUser')}
          </p>
          {canCreate && (
            <div className="mt-4 flex justify-center">
              <Button variant="primary" size="md" asChild>
                <Link href="/projects/new"><Plus size={13} /> {t('projects.newProject')}</Link>
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p, i) => {
            const myRole = p.members.find(m => m.email === user.email)?.projectRole
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/projects/${p.id}`}>
                  <Card className="p-5 card-interactive group cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0078D4] to-[#106EBE] shadow-md">
                        <FolderGit2 size={16} className="text-white" strokeWidth={2.2} />
                      </div>
                      <Badge
                        variant={p.status === 'active' ? 'success' : p.status === 'provisioning' ? 'warning' : 'default'}
                        size="sm"
                        dot
                      >
                        {p.status}
                      </Badge>
                    </div>

                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    <p className="text-[11px] font-mono mb-3 truncate flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Link href="#" className="hover:underline text-[#0078D4]" onClick={e => e.stopPropagation()}>
                        {p.gitlabPath}
                      </Link>
                    </p>

                    <p className="text-xs line-clamp-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {p.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1"><UsersIcon size={10} /> {p.members.length}</span>
                        <span className="flex items-center gap-1"><GitBranch size={10} /> main</span>
                      </div>
                      {myRole && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0078D4]">
                          {myRole === 'owner' ? t('projects.ownerStar') : myRole}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
