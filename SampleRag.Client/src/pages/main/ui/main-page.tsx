import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '../../../shared/lib/cn'

export function MainPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('main.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('main.subtitle')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/chats"
            className={cn(
              'flex flex-col items-start justify-between rounded-lg border border-muted bg-background p-4 text-left shadow-sm transition-colors',
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                {t('main.cards.chat.title')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('main.cards.chat.description')}
              </p>
            </div>
            <span className="mt-3 text-xs font-medium text-sky-600">
              {t('main.cards.chat.action')}
            </span>
          </Link>
          <Link
            to="/documents"
            className={cn(
              'flex flex-col items-start justify-between rounded-lg border border-muted bg-background p-4 text-left shadow-sm transition-colors',
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                {t('main.cards.documents.title')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('main.cards.documents.description')}
              </p>
            </div>
            <span className="mt-3 text-xs font-medium text-sky-600">
              {t('main.cards.documents.action')}
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

