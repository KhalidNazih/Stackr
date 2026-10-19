'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as Theme | null
    setTheme(stored ?? 'system')
  }, [])

  const apply = (t: Theme) => {
    setTheme(t)
    if (t === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', t)

    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  if (!mounted) return <div className={cn('h-9 w-[100px]', className)} />

  return (
    <div className={cn('inline-flex items-center rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-200 p-0.5', className)}>
      {([
        { v: 'light',  icon: Sun     },
        { v: 'system', icon: Monitor },
        { v: 'dark',   icon: Moon    },
      ] as const).map(({ v, icon: Icon }) => (
        <button
          key={v}
          onClick={() => apply(v)}
          aria-label={`${v} theme`}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-all',
            theme === v
              ? 'bg-brand-navy text-white shadow-xs'
              : 'text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-200'
          )}
        >
          <Icon size={13} strokeWidth={2.25} />
        </button>
      ))}
    </div>
  )
}
