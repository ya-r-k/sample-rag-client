import { QueryInput } from '../../../features/ask-question/ui/query-input'
import { MessageDto } from '../../../shared/api/messages'
import { DocumentDto } from '../../../shared/api/documents'
import { cn } from '../../../shared/lib/cn'
import { Spinner } from '../../../shared/ui/spinner'
import { MessageList } from './message-list'
import { useTranslation } from 'react-i18next'

type CreatedChatInteractionViewProps = {
  className?: string
  chatId: string
  messages: MessageDto[]
  documentsById?: Record<string, DocumentDto>
  handleSubmit: (text: string, scopeId: string | null) => void
  scopeId: string | null
  onScopeIdChange: (scopeId: string | null) => void
  canSubmit: boolean
  isSubmitting: boolean
}

export function CreatedChatInteractionView({
  className,
  chatId,
  messages,
  documentsById,
  handleSubmit,
  scopeId,
  onScopeIdChange,
  canSubmit,
  isSubmitting,
}: CreatedChatInteractionViewProps) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col pt-3', className)}>
      <MessageList messages={messages} documentsById={documentsById} className="min-h-0" />
      <div className="mb-3 mt-auto flex w-full shrink-0 flex-col items-center justify-center shadow-sm dark:shadow-md">
        <QueryInput
          onSubmit={handleSubmit}
          chatId={chatId}
          scopeId={scopeId}
          onScopeIdChange={onScopeIdChange}
          disabled={!canSubmit || isSubmitting}
          placeholder={isSubmitting ? t('chat.placeholderSending') : t('chat.placeholderClarify')}
        />
        {isSubmitting && (
          <div
            className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"
            aria-busy="true"
          >
            <Spinner className="h-4 w-4" />
            <span>{t('chat.gettingAnswer')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
