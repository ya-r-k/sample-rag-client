import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getGroups } from '../../../shared/api/groups'
import { sendMessage } from '../../../shared/api/messages'
import { ScopeSelector } from '../../../features/ask-question/ui/scope-selector'
import { QueryInput } from '../../../features/ask-question/ui/query-input'
import { MessageList, type MessageItem } from '../../../widgets/chat/ui/message-list'
import { cn } from '../../../shared/lib/cn'

export function ChatPage() {
  const [scopeId, setScopeId] = useState<string | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: scopes = [], isLoading: scopesLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  })

  const handleSubmit = useCallback(
    async (text: string) => {
      if (isSubmitting) return
      if (!scopeId && !chatId) return

      setIsSubmitting(true)
      try {
        const body = chatId
          ? { chatId, text }
          : { scopeId: scopeId!, text }
        const result = await sendMessage(body)

        setMessages((prev) => [
          ...prev,
          { role: 'user', text },
          {
            role: 'assistant',
            text: result.answer,
            sources: result.sources,
          },
        ])

        if (result.chat) {
          setChatId(result.chat.id)
        }
      } catch (err) {
        console.error('Send message failed:', err)
      } finally {
        setIsSubmitting(false)
      }
    },
    [scopeId, chatId, isSubmitting],
  )

  const canSubmit =
    (chatId != null || (scopeId != null && scopes.length > 0)) &&
    !scopesLoading &&
    !isSubmitting

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-muted pb-3">
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          Scope
        </label>
        <ScopeSelector
          scopes={scopes}
          value={chatId ? null : scopeId}
          onChange={setScopeId}
          disabled={!!chatId || scopesLoading}
          placeholder={scopesLoading ? 'Loading...' : 'Select scope'}
        />
      </div>

      <MessageList messages={messages} className="min-h-0" />

      <div className="shrink-0 pt-3">
        <QueryInput
          onSubmit={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          placeholder={isSubmitting ? 'Sending...' : 'Ask a question...'}
        />
        {isSubmitting && (
          <div
            className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"
            aria-busy="true"
          >
            <Spinner className="h-4 w-4" />
            <span>Getting answer...</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
