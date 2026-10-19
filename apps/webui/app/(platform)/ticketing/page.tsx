'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Ticket as TicketIcon, Search, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTickets } from '@/lib/tickets-store'
import { useAuth } from '@/lib/auth-context'
import { IncidentModal } from '@/components/ui/IncidentModal'
import { formatRelativeTime } from '@/lib/utils'
import { useT } from '@/lib/i18n/i18n-context'

export default function TicketingPage() {
  const { t } = useT()
  const { user } = useAuth()
  const { tickets, loaded, fetchTickets, updateTicketStatus } = useTickets()
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [resolveTicketId, setResolveTicketId] = useState<string | null>(null)
  const [resolutionComment, setResolutionComment] = useState('')

  useEffect(() => {
    if (!loaded) fetchTickets()
  }, [loaded, fetchTickets])

  const visible = tickets.filter(t => {
    // Admins and managers see all tickets. Standard users see all tickets or theirs.
    const canSeeAll = user?.role === 'admin' || user?.role === 'manager'
    if (!canSeeAll && t.reported_by && user?.email && t.reported_by.toLowerCase() !== user.email.toLowerCase()) {
      // If there are specific user tickets, prefer showing them, but allow seeing all if needed
    }
    
    // Search filtering
    return !query.trim() ||
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.reported_by.toLowerCase().includes(query.toLowerCase())
  })

  const handleStatusChange = (id: string, currentStatus: string) => {
    if (currentStatus === 'in_progress') {
      setResolveTicketId(id)
      setResolutionComment('')
      return
    }
    let nextStatus = 'in_progress'
    if (currentStatus === 'resolved') nextStatus = 'open'
    updateTicketStatus(id, nextStatus)
  }

  const submitResolution = () => {
    if (!resolveTicketId) return
    updateTicketStatus(resolveTicketId, 'resolved', resolutionComment)
    setResolveTicketId(null)
    setResolutionComment('')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {user?.role === 'admin' ? t('ticketing.titleAdmin') : t('ticketing.titleUser')}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {user?.role === 'admin' ? t('ticketing.subtitleAdmin') : t('ticketing.subtitleUser')}
          </p>
        </div>
        
        {user?.role !== 'admin' && (
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <AlertCircle size={14} className="mr-2" />
            {t('common.reportIncident')}
          </Button>
        )}
      </div>
      
      <IncidentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          placeholder={t('ticketing.searchPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
        />
      </div>

      <div className="grid gap-4">
        {visible.map((ticket, i) => (
          <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                  }`}>
                    {ticket.status === 'resolved' ? <CheckCircle2 size={18} /> : ticket.status === 'in_progress' ? <Clock size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{ticket.title}</h3>
                    <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                      {t('ticketing.ticketId').replace('{id}', ticket.id.split('-')[0].toUpperCase())}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={ticket.status === 'resolved' ? 'success' : ticket.status === 'in_progress' ? 'info' : 'error'} size="sm" className="capitalize">
                    {t(`ticket.status.${ticket.status}` as any) || ticket.status.replace('_', ' ')}
                  </Badge>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <Button variant="secondary" size="sm" onClick={() => handleStatusChange(ticket.id, ticket.status)}>
                      {ticket.status === 'open' ? t('ticketing.markInProgress') : ticket.status === 'in_progress' ? t('ticketing.markResolved') : t('ticketing.reopen')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="pl-13 text-[13px] text-gray-600 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-black/20 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                {ticket.description}
              </div>

              {ticket.status === 'resolved' && ticket.resolution_message && (
                <div className="pl-13 text-[13px] mb-4 bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                    {t('ticketing.resolution' as any) || 'Resolution Comment'}:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    {ticket.resolution_message}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium px-1">
                <span>{t('ticketing.reportedBy').replace('{name}', ticket.reported_by)}</span>
                <span>•</span>
                <span>{formatRelativeTime(ticket.created_at)}</span>
              </div>
            </Card>
          </motion.div>
        ))}

        {visible.length === 0 && (
          <div className="py-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <TicketIcon size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('ticketing.noTickets')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('ticketing.noTicketsSub')}</p>
          </div>
        )}
      </div>

      {resolveTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl border border-gray-200 dark:border-gray-800" style={{ background: 'var(--bg-card)' }}>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('ticketing.resolveTitle' as any) || 'Resolve Incident'}
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('ticketing.resolveDesc' as any) || 'Please enter a resolution comment for the reporter.'}
              </p>
            </div>
            <textarea
              value={resolutionComment}
              onChange={e => setResolutionComment(e.target.value)}
              placeholder={t('ticketing.resolvePlaceholder' as any) || 'Describe how the issue was resolved...'}
              className="w-full h-24 rounded-lg border p-3 text-[13px] outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/15 resize-none"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-dark)', color: 'var(--text-primary)' }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setResolveTicketId(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" size="sm" onClick={submitResolution} disabled={!resolutionComment.trim()}>
                {t('common.submit' as any) || 'Submit'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
