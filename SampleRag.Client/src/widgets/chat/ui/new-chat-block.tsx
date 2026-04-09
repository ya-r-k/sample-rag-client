import { QueryInput } from '../../../features/ask-question/ui/query-input'
import { cn } from '../../../shared/lib/cn'
import { useTranslation } from 'react-i18next'

type NewChatBlockProps = {
  className?: string
  handleSubmit: (text: string, scopeId: string | null) => void
  scopeId: string | null
  onScopeIdChange: (scopeId: string | null) => void
  chatId?: string | null
  canSubmit: boolean
  isSubmitting: boolean
  hasDocuments: boolean
}

export function NewChatBlock({
  className,
  handleSubmit,
  scopeId,
  onScopeIdChange,
  chatId = null,
  canSubmit,
  isSubmitting,
  hasDocuments,
}: NewChatBlockProps) {
  const { t } = useTranslation()
  return (
    <div className={cn("flex flex-col items-center justify-center shrink-0 pt-3 h-full", className)}>
      <h1 className="text-4xl text-center font-semibold text-foreground mb-10 flex w-full items-center justify-center pb-3 text-center">{t('chat.newChatTitle')}</h1>
        <QueryInput
          onSubmit={handleSubmit}
          chatId={chatId}
          scopeId={scopeId}
          onScopeIdChange={onScopeIdChange}
          disabled={!canSubmit || isSubmitting || !hasDocuments}
          placeholder={isSubmitting ? t('chat.placeholderSending') : t('chat.placeholderAsk')}
        />
    </div>
  )
}
