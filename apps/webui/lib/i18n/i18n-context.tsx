'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { translate, type Locale, type TranslationKey } from './translations'

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey) => string
  hydrated: boolean
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'stackr.locale'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
      if (stored === 'en' || stored === 'fr') {
        setLocaleState(stored)
      } else {
        const browser = navigator.language.toLowerCase()
        if (browser.startsWith('fr')) setLocaleState('fr')
      }
    } catch {}
    setHydrated(true)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch {}
    document.documentElement.lang = l
  }, [])

  const t = useCallback((key: TranslationKey) => translate(key, locale), [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, hydrated }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useT(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT must be used inside <I18nProvider>')
  return ctx
}
