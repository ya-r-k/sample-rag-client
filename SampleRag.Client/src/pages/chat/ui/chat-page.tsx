import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getGroups } from '../../../shared/api/scopes'
import { deleteChat, getChats, createChat } from '../../../shared/api/chats'
import { sendMessage, NEW_CHAT_ID } from '../../../shared/api/messages'
import { QueryInput } from '../../../features/ask-question/ui/query-input'
import { ChatUnavailable } from '../../../features/ask-question/ui/chat-unavailable'
import { MessageList, type MessageItem } from '../../../widgets/chat/ui/message-list'
import { ChatSidebar } from '../../../widgets/chat-sidebar/ui/chat-sidebar'
import { ShareChatForm } from '../../../features/share-chat/ui/share-chat-form'
import { cn } from '../../../shared/lib/cn'

export function ChatPage() {
  const { chatId: routeChatId } = useParams<{ chatId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const chatId = routeChatId ?? null
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [hasDocuments] = useState(true)

  const { data: scopes = [], isLoading: scopesLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroups(),
  })

  const { data: chats = [] } = useQuery({
    queryKey: ['chats'],
    queryFn: () => getChats(),
  })
  const chatData = useMemo(
    () => (chatId ? chats.find((c) => c.id === chatId) : null),
    [chats, chatId],
  )

  const cachedMessages = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: () =>
      Promise.resolve(
        (queryClient.getQueryData<MessageItem[]>(['chat-messages', chatId]) ?? []) as MessageItem[],
      ),
    enabled: !!chatId,
    initialData: () =>
      (queryClient.getQueryData<MessageItem[]>(['chat-messages', chatId]) ?? []) as MessageItem[],
  })

  const messages: MessageItem[] = useMemo(() => {
    if (!chatId) return []
    return cachedMessages.data ?? []
  }, [chatId, cachedMessages.data])

  const handleSelectChat = useCallback(
    (id: string) => {
      navigate(`/chats/${id}`)
    },
    [navigate],
  )

  const handleSubmit = useCallback(
    async (text: string) => {
      if (isSubmitting) return
      if (!hasDocuments && !chatId) return

      setIsSubmitting(true)
      try {
        const effectiveScopeId =
          chatId != null ? undefined : scopes[0]?.id

        if (!chatId && !effectiveScopeId) {
          return
        }

        let effectiveChatId = chatId
        if (!effectiveChatId && effectiveScopeId) {
          const newChat = await createChat({
            name: 'New chat',
            scopeId: effectiveScopeId,
          })
          effectiveChatId = newChat.id
        }
        const result = await sendMessage({
          chatId: effectiveChatId ?? NEW_CHAT_ID,
          text,
        })

        const userItem: MessageItem = { role: 'user', text }
        const assistantItem: MessageItem = {
          role: 'assistant',
          text: result.answer,
          sources: result.sources,
        }

        const newChatId = result.chat?.id ?? effectiveChatId ?? chatId
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
        } else if (effectiveChatId && !chatId) {
          navigate(`/chats/${effectiveChatId}`)
        }
      } catch (err) {
        console.error('Send message failed:', err)
      } finally {
        setIsSubmitting(false)
      }
    },
    [chatId, hasDocuments, isSubmitting, queryClient, navigate, scopes],
  )

  const canSubmit =
    (!scopesLoading && scopes.length > 0) &&
    !isSubmitting &&
    !isDeleting

  const handleDeleteChat = useCallback(async () => {
    if (!chatId) {
      return
    }
    const confirmed = window.confirm('Delete this chat? This action cannot be undone.')
    if (!confirmed) {
      return
    }
    setIsDeleting(true)
    try {
      await deleteChat(chatId)
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      queryClient.removeQueries({ queryKey: ['chat', chatId] })
      queryClient.removeQueries({ queryKey: ['chat-messages', chatId] })
      navigate('/chats')
    } catch (error) {
      console.error('Delete chat failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [chatId, navigate, queryClient])

  return (
    <>
      <ChatSidebar
        activeChatId={chatId}
        onSelectChat={handleSelectChat}
      />
      <div className="col-start-2 col-end-3 row-start-1 row-end-2 flex min-h-0 flex-1 flex-col">
        {chatId && (
          <div className="shrink-0 border-b border-muted pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {chatData?.name ?? 'New chat'}
                </h2>
              </div>
            {chatId && (
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowShare((prev) => !prev)}
                    className="inline-flex items-center justify-center rounded-md border border-muted bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {showShare ? 'Close sharing' : 'Share chat'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteChat}
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center rounded-md border border-destructive bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isDeleting ? 'Deleting…' : 'Delete chat'}
                  </button>
                </div>
                {showShare && (
                  <div className="w-64">
                    <ShareChatForm chatId={chatId} />
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        )}

        {chatId && <MessageList messages={messages} className="min-h-0" />}

        <div className="flex flex-col items-center justify-center shrink-0 pt-3 h-full">
          <h1 className="text-4xl text-center font-semibold text-foreground mb-10 flex w-full items-center justify-center pb-3 text-center">Sample RAG Client Chat</h1>
          <QueryInput
            onSubmit={handleSubmit}
            disabled={!canSubmit || isSubmitting || (!hasDocuments && !chatId)}
            placeholder={isSubmitting ? 'Sending...' : 'Ask a question...'}
          />
          {!hasDocuments && !chatId && (
            <ChatUnavailable className="mt-2" />
          )}
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
    </>
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
