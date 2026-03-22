import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageSquare } from 'lucide-react'
import { cn } from '../shared/lib/cn'

export function PlaceholderPage() {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <h1 className="text-xl font-semibold">{t('appName')}</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        RAG chat client foundation is ready. Start a chat to ask questions and get answers with sources.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/chats"
          className={cn(
            'inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Go to Chats
        </Link>
      </div>
    </div>
  )
}

