'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, Construction } from 'lucide-react'
import { useT } from '@/lib/i18n/i18n-context'

export default function GenericPage() {
  const { t, locale } = useT()
  const params = useParams()
  const slug = params.slug as string[]
  const title = slug?.[0] ? slug[0].charAt(0).toUpperCase() + slug[0].slice(1) : 'Page'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">{title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">
            {locale === 'fr' 
              ? `Gérer les configurations et paramètres de ${title.toLowerCase()}.` 
              : `Manage your ${title.toLowerCase()} settings and configurations.`}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="text-[#0078D4]" size={20} />
            {t('generic.construction')}
          </CardTitle>
          <CardDescription>
            {locale === 'fr'
              ? `Le module de ${title.toLowerCase()} est actuellement en cours de développement.`
              : `The ${title} module is currently being developed.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0078D4]/10 mb-4">
              <Sparkles className="text-[#0078D4]" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('generic.comingSoon')}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 max-w-sm">
              {locale === 'fr'
                ? `Nous travaillons dur pour vous offrir la meilleure expérience pour ${title.toLowerCase()}. Revenez bientôt pour les mises à jour !`
                : `We are working hard to bring you the best experience for ${title.toLowerCase()}. Check back soon for updates!`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
