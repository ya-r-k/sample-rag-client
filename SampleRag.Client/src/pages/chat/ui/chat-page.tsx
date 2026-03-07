import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getGroups } from '../../../shared/api/groups'
import { getChatById } from '../../../shared/api/chats'
import { sendMessage } from '../../../shared/api/messages'
import { ScopeSelector } from '../../../features/ask-question/ui/scope-selector'
import { QueryInput } from '../../../features/ask-question/ui/query-input'
import { MessageList, type MessageItem } from '../../../widgets/chat/ui/message-list'
import { ChatSidebar } from '../../../widgets/chat-sidebar/ui/chat-sidebar'
import { cn } from '../../../shared/lib/cn'
import type { MessageDto } from '../../../shared/api/chats'

/** Map API messages to MessageItem (alternating user/assistant when role not provided). */
function mapApiMessagesToItems(messages: MessageDto[]): MessageItem[] {
  return messages.map((msg, i) => ({
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    text: msg.text,
    sources: undefined,
  }))
}

export function ChatPage() {
  const { chatId: routeChatId } = useParams<{ chatId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const chatId = routeChatId ?? null

  const [scopeId, setScopeId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: scopes = [], isLoading: scopesLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  })

  const { data: chatData } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => getChatById(chatId!),
    enabled: !!chatId,
  })

  const cachedMessages = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: () =>
      Promise.resolve(
        (queryClient.getQueryData<MessageItem[]>(['chat-messages', chatId]) ?? []) as MessageItem[],
      ),
    enabled: !!chatId && !(chatData?.messages && chatData.messages.length > 0),
    initialData: () =>
      (queryClient.getQueryData<MessageItem[]>(['chat-messages', chatId]) ?? []) as MessageItem[],
  })

  const messages: MessageItem[] = useMemo(() => {
    if (!chatId) return []
    if (chatData?.messages && chatData.messages.length > 0) {
      return mapApiMessagesToItems(chatData.messages)
    }
    return cachedMessages.data ?? []
  }, [chatId, chatData?.messages, cachedMessages.data])

  const handleSelectChat = useCallback(
    (id: string) => {
      navigate(`/chats/${id}`)
    },
    [navigate],
  )

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

        const userItem: MessageItem = { role: 'user', text }
        const assistantItem: MessageItem = {
          role: 'assistant',
          text: result.answer,
          sources: result.sources,
        }

        const newChatId = result.chat?.id ?? chatId
        if (newChatId) {
          queryClient.setQueryData<MessageItem[]>(['chat-messages', newChatId], (prev) => [
            ...(prev ?? []),
            userItem,
            assistantItem,
          ])
          queryClient.invalidateQueries({ queryKey: ['chat', newChatId] })
        }

        if (result.chat && !chatId) {
          queryClient.invalidateQueries({ queryKey: ['chats'] })
          navigate(`/chats/${result.chat.id}`)
        }
      } catch (err) {
        console.error('Send message failed:', err)
      } finally {
        setIsSubmitting(false)
      }
    },
    [scopeId, chatId, isSubmitting, queryClient, navigate],
  )

  const canSubmit =
    (chatId != null || (scopeId != null && scopes.length > 0)) &&
    !scopesLoading &&
    !isSubmitting

  return (
    <div className="flex min-h-0 flex-1 gap-0">
      <ChatSidebar
        activeChatId={chatId}
        onSelectChat={handleSelectChat}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-muted pb-3">
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Scope
          </label>
          <ScopeSelector
            scopes={scopes}
            value={chatId ? chatData?.scopeId ?? null : scopeId}
            onChange={chatId ? () => {} : setScopeId}
            disabled={!!chatId || scopesLoading}
            placeholder={scopesLoading ? 'Loading...' : 'Select scope'}
          />
          {chatId && (
            <h2 className="mt-2 text-base font-medium text-foreground">
              {chatData?.title || 'New chat'}
            </h2>
          )}
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
