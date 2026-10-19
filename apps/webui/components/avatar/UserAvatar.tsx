'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react'
import { useAuth, ROLE_META } from '@/lib/auth-context'
import { getAvatarIcon } from './avatarIcons'
import { cn } from '@/lib/utils'

export function UserAvatar() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!user) return null

  const def = getAvatarIcon(user.avatarIcon)
  const Icon = def.icon
  const role = ROLE_META[user.role]

  return (
    <div ref={ref} className="relative ml-2">
      {/* ── Avatar trigger ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Account menu"
        className={cn(
          'group relative h-9 w-9 shrink-0 rounded-full',
          'transition-all duration-300',
          'ring-2 ring-white/15 hover:ring-white/40',
          open && 'ring-white/60'
        )}
      >
        {/* Animated halo on hover/open */}
        <span
          className={cn(
            'absolute inset-0 rounded-full opacity-0 blur-md transition-opacity duration-300',
            'bg-gradient-to-br', def.gradient,
            'group-hover:opacity-80', open && 'opacity-90'
          )}
        />

        {/* Gradient ring on open */}
        <span
          className={cn(
            'absolute -inset-[2px] rounded-full bg-gradient-to-br opacity-0 transition-opacity duration-300',
            def.gradient,
            open && 'opacity-100 animate-spin-slow'
          )}
        />

        {/* Inner avatar */}
        <span
          className={cn(
            'relative flex h-full w-full items-center justify-center rounded-full overflow-hidden',
            'bg-gradient-to-br shadow-lg',
            def.gradient
          )}
        >
          {/* Subtle inner shine */}
          <span className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/20" />
          <Icon
            size={17}
            strokeWidth={2.2}
            className={cn(
              'relative text-white drop-shadow-sm transition-transform duration-300',
              'group-hover:scale-110',
              open && 'scale-110'
            )}
          />
        </span>

        {/* Online status pulse */}
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#1C1C1C]">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
        </span>
      </button>

      {/* ── Dropdown menu ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute right-0 top-[calc(100%+10px)] z-50 w-[280px] rounded-xl overflow-hidden',
              'bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800',
              'shadow-2xl'
            )}
          >
            {/* Header — gradient banner */}
            <div className={cn('relative px-4 py-4 bg-gradient-to-br', def.gradient)}>
              <div className="absolute inset-0 opacity-25"
                   style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 0%, transparent 50%)' }} />
              <div className="relative flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 ring-2 ring-white/40 backdrop-blur-sm">
                  <Icon size={20} strokeWidth={2.2} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-white/85 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Role pill */}
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Role
              </span>
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold', role.bg, role.color)}>
                <ShieldCheck size={10} strokeWidth={2.5} />
                {role.label}
              </span>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              {[
                { href: '/settings',           icon: Settings,    label: 'Account settings', desc: 'Profile, avatar, preferences' },
                ...(user.role === 'admin'
                  ? [{ href: '/admin', icon: ShieldCheck, label: 'Admin panel', desc: 'Manage platform & tenants' }]
                  : []),
              ].map(({ href, icon: I, label, desc }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.06] group-hover:bg-[#0078D4]/10 transition-colors">
                    <I size={13} className="text-gray-600 dark:text-gray-300 group-hover:text-[#0078D4] transition-colors" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{label}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate">{desc}</p>
                  </div>
                  <ChevronRight size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-[#0078D4] group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 p-1.5">
              <button
                onClick={() => { setOpen(false); signOut() }}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/10">
                  <LogOut size={13} strokeWidth={2.2} />
                </div>
                <span className="text-[13px] font-semibold">Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
