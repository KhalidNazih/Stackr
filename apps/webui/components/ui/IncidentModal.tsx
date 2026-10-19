'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, X, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useT } from '@/lib/i18n/i18n-context'
import { useNotifications } from '@/lib/notifications-store'
import { useTickets } from '@/lib/tickets-store'
import { useAuth } from '@/lib/auth-context'

interface IncidentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function IncidentModal({ isOpen, onClose }: IncidentModalProps) {
  const { t } = useT()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const { addNotification } = useNotifications()
  const { createTicket } = useTickets()
  const { user } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await createTicket({
        title,
        description,
        reported_by: user?.email || 'unknown@stackr.com'
      })
      
      setSubmitted(true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSubmitted(false)
    setTitle('')
    setDescription('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white dark:bg-[#1E1E1E] rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertCircle size={18} strokeWidth={2.5} />
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t('incident.title') || 'Report an Incident'}</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('incident.reported') || 'Incident Reported'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('incident.successMessage') || 'Your incident has been submitted successfully to the platform engineering team.'}
                <br />
                Ticket ID: <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold">INC-{Math.floor(1000 + Math.random() * 9000)}</span>
              </p>
            </div>
            <Button variant="secondary" onClick={handleClose} className="mt-4">{t('common.close') || 'Close'}</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <Label className="mb-1.5 text-[12px] text-gray-600 dark:text-gray-400">{t('incident.incidentTitle') || 'Incident Title'}</Label>
              <Input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Cluster API unresponsive"
                className="bg-gray-50 dark:bg-black/20"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-[12px] text-gray-600 dark:text-gray-400">{t('incident.description') || 'Description'}</Label>
              <Textarea
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('incident.placeholder') || 'Please describe the issue, impacted services, and steps to reproduce...'}
                className="h-32 bg-gray-50 dark:bg-black/20 resize-none text-sm"
              />
            </div>
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
              <p className="text-[11px] text-rose-700 dark:text-rose-400 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {t('incident.warning') || 'This will trigger an immediate alert to the on-call platform engineers. Please use only for critical issues or outages.'}
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={handleClose}>{t('common.cancel') || 'Cancel'}</Button>
              <Button type="submit" variant="danger" disabled={loading}>
                {loading ? (t('incident.submitting') || 'Submitting...') : <><Send size={14} className="mr-2" /> {t('incident.submit') || 'Submit Report'}</>}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
