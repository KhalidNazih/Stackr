import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { MeProvider } from '@/lib/me-store'
import { I18nProvider } from '@/lib/i18n/i18n-context'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const brand = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-brand',
  display: 'swap',
  weight: ['500', '600', '700'],
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: { default: 'Stackr · Developer Platform', template: '%s · Stackr' },
  description: 'Stackr — Internal Developer Platform for self-service environments, GitOps and DevSecOps.',
  applicationName: 'Stackr',
  icons: {
    icon: '/stackicon.png',
  }
}

export const viewport: Viewport = { themeColor: '#1F2D5A' }

// Inline script — sets theme before paint to avoid FOUC
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${brand.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased font-sans transition-colors" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
        <I18nProvider>
          <MeProvider>
            <AuthProvider>{children}</AuthProvider>
          </MeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
