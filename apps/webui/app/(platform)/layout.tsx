'use client'

import { Header } from '@/components/layout/Header'
import { useAuth } from '@/lib/auth-context'
import { FullScreenLoader } from '@/components/ui/FullScreenLoader'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { hydrated, signedIn } = useAuth()

  if (!hydrated) {
    return <FullScreenLoader />
  }

  // The middleware protects the routes, but just in case:
  if (!signedIn) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Header />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  )
}
