'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, ShieldCheck, Lock, KeyRound, Layers, GitBranch, Zap, Check } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Logo, LogoMark } from '@/components/brand/Logo'
import { useAuth } from '@/lib/auth-context'
import { useT } from '@/lib/i18n/i18n-context'
import { LOCALES } from '@/lib/i18n/translations'
import { cn } from '@/lib/utils'
import type { TranslationKey } from '@/lib/i18n/translations'
import { FullScreenLoader } from '@/components/ui/FullScreenLoader'

const FEATURES: { icon: typeof Layers; tkey: TranslationKey }[] = [
  { icon: Layers,      tkey: 'login.feature1' },
  { icon: GitBranch,   tkey: 'login.feature2' },
  { icon: ShieldCheck, tkey: 'login.feature3' },
  { icon: Zap,         tkey: 'login.feature4' },
]

const STATS: { value: string; tkey: TranslationKey }[] = [
  { value: '12+',   tkey: 'login.stat1' },
  { value: '99.9%', tkey: 'login.stat2' },
  { value: '<2m',   tkey: 'login.stat3' },
]

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const { t, locale, setLocale } = useT()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  // ── Real Keycloak SSO ──────────────────────────────────────────────────────
  const handleSSO = () => {
    setLoading(true)
    window.location.href = '/api/auth/login'
  }

  // ── Dev bypass (only for development — sets a plain cookie) ───────────────
  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    // Non-httpOnly cookie read by middleware as dev bypass
    document.cookie = `dev_auth=${encodeURIComponent(email)}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`
    signIn(email)
    router.push('/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>

      {/* ─── Left brand panel ─── */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between p-10 overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0078D4 100%)' }}>

        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex items-center justify-center gap-4">
          <LogoMark size={48} />
          <Logo size="2xl" variant="white" className="text-5xl font-bold tracking-tight" />
        </div>

        <div className="relative z-10 max-w-lg mt-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 mb-5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/85">
              {t('login.badge')}
            </span>
          </div>

          <h1 className="text-[38px] font-semibold text-white leading-[1.08] tracking-tight">
            {t('login.shipFaster')}<br />
            <span className="text-white/55">{t('login.withConfidence')}</span>
          </h1>

          <p className="mt-3 text-[14px] text-white/65 leading-relaxed max-w-md font-light">
            {t('login.heroDescription')}
          </p>

          <ul className="mt-6 space-y-2">
            {FEATURES.map(({ icon: Icon, tkey }) => (
              <li key={tkey} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-inset ring-white/15">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-[13px] text-white/85 font-light">{t(tkey)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mt-6">
          <div className="grid grid-cols-3 gap-6 pb-4 border-b border-white/[0.08]">
            {STATS.map((s) => (
              <div key={s.tkey}>
                <p className="text-[24px] font-semibold text-white tracking-tight leading-none">{s.value}</p>
                <p className="text-[10px] text-white/45 font-medium uppercase tracking-[0.12em] mt-2">{t(s.tkey)}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
            <span>© {new Date().getFullYear()} Stackr. All rights reserved.</span>
            <span className="font-mono tracking-tight">v0.1.0</span>
          </div>
        </div>
      </div>

      {/* ─── Right form ─── */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12" style={{ background: 'var(--bg-page)' }}>

        <div className="absolute right-8 top-8">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[400px] animate-fade-up">

          <div className="mb-10 flex items-center gap-3">
            <LogoMark size={32} />
            <Logo size="xl" className="font-bold tracking-tight text-3xl" />
          </div>

          <div className="mb-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0078D4]">
              {t('login.signIn')}
            </p>
            <h2 className="text-[30px] font-semibold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
              {t('login.welcomeBack')}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t('login.subtitle')}
            </p>
          </div>

          {/* SSO — redirects to real Keycloak */}
          <button
            onClick={handleSSO}
            className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-lg bg-[#0078D4] px-4 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#106EBE] hover:shadow-md disabled:opacity-70"
          >
            <KeyRound size={15} strokeWidth={2.25} />
            {t('login.continueSSO')}
            <ArrowRight size={14} strokeWidth={2.25} className="ml-0.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="mt-8 grid grid-cols-3 gap-2">
            {[
              { icon: Lock,        label: t('login.mfa')  },
              { icon: ShieldCheck, label: t('login.rbac') },
              { icon: KeyRound,    label: t('login.jwt')  },
            ].map(({ icon: Icon, label }) => (
              <div key={label}
                   className="flex items-center gap-1.5 rounded-md border px-2 py-1.5"
                   style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <Icon size={11} className="text-[#0078D4] shrink-0" strokeWidth={2.25} />
                <p className="text-[10px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
            <span>{t('login.authorized')}</span>
            <div className="flex items-center gap-3">
              {LOCALES.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}
                  className={cn('uppercase font-semibold tracking-wide transition-colors', locale === l.code ? 'text-[#0078D4]' : 'hover:text-[#0078D4]')}
                >
                  {l.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && <FullScreenLoader />}
    </div>
  )
}
