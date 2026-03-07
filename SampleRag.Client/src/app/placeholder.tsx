import { Button } from '../shared/ui/button'
import { useTranslation } from 'react-i18next'

export function PlaceholderPage() {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">{t('appName')}</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        RAG chat client foundation is ready. User stories will be implemented in next phases.
      </p>
      <Button>Get started</Button>
    </div>
  )
}

