import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getScopes } from '../../../shared/api/scopes'
import { deleteChat, getChats, type ChatDto } from '../../../shared/api/chats'
import {
  sendMessage,
  getMessagesFilter,
  type MessageDto,
  type SourceDto,
} from '../../../shared/api/messages'
import { getDocumentsByIds, type DocumentDto } from '../../../shared/api/documents'
import { ChatSidebar } from '../../../widgets/chat-sidebar/ui/chat-sidebar'
import { ChatHeading } from '../../../widgets/chat/ui/chat-heading'
import { Spinner } from '../../../shared/ui/spinner'
import { NewChatBlock } from '../../../widgets/chat/ui/new-chat-block'
import { CreatedChatInteractionView } from '../../../widgets/chat/ui/created-chat-interaction-view'
import { useTranslation } from 'react-i18next'

export function ChatPage() {
  const { t } = useTranslation()
  const { chatId } = useParams<{ chatId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [hasDocuments] = useState(true)
  /** Optimistic thread on /chats before the server returns chat id */
  const [draftMessages, setDraftMessages] = useState<MessageDto[] | null>(null)

  useEffect(() => {
    if (chatId) {
      setDraftMessages(null)
    }
  }, [chatId])

  const { data: scopes = [], isLoading: scopesLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getScopes(),
  })

  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['chats', 20],
    queryFn: () => getChats({ batchSize: 20 }),
  })
  const chatData = useMemo(
    () => (chatId ? chats.find((c) => c.id === chatId) : null),
    [chats, chatId],
  )

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: () => getMessagesFilter({ chatId: chatId ?? undefined, batchSize: 30 }),
    // While sending, rely on cache updates from streaming / optimistic updates (avoid overwriting with a stale filter).
    enabled: !!chatId && !isSubmitting,
  })

  const displayMessages: MessageDto[] = chatId ? messages : (draftMessages ?? [])

  const documentIds = useMemo(() => {
    const set = new Set<string>()
    for (const m of displayMessages) {
      for (const s of m.sourceReferences ?? []) {
        if (s.documentId) set.add(s.documentId)
      }
    }
    return [...set].sort()
  }, [displayMessages])

  const { data: loadedDocuments = [] } = useQuery({
    queryKey: ['chat-documents-by-ids', documentIds.join('|')],
    queryFn: () => getDocumentsByIds(documentIds),
    enabled: documentIds.length > 0,
    staleTime: 60_000,
  })

  const documentsById = useMemo(
    () => Object.fromEntries(loadedDocuments.map((d: DocumentDto) => [d.id, d])),
    [loadedDocuments],
  )

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
      let streamedChatId = chatId
      const userItem: MessageDto = { text, aiGenerated: false }
      const assistantItem: MessageDto = { text: '', aiGenerated: true, sourceReferences: [] }

      const upsertChatInSidebar = (chat: ChatDto) => {
        queryClient.setQueryData<ChatDto[]>(['chats', 20], (prev) => {
          const next = prev ? [...prev] : []
          const existingIndex = next.findIndex((item) => item.id === chat.id)
          if (existingIndex >= 0) {
            next[existingIndex] = chat
            return next
          }
          return [chat, ...next]
        })
      }

      const ensureAssistantMessage = (items: MessageDto[], targetChatId: string) => {
        const next = [...items]
        if (next.length === 0) {
          next.push({ ...userItem, chatId: targetChatId })
        }
        const assistantIndex = next.findIndex((item) => item.aiGenerated === true && !item.id)
        if (assistantIndex >= 0) {
          return { next, assistantIndex }
        }
        next.push({ ...assistantItem, chatId: targetChatId })
        return { next, assistantIndex: next.length - 1 }
      }

      if (!chatId) {
        setDraftMessages([
          { ...userItem },
          { ...assistantItem },
        ])
      }

      try {
        if (chatId) {
          queryClient.setQueryData<MessageDto[]>(['chat-messages', chatId], (prev) => [
            ...(prev ?? []),
            { ...userItem, chatId },
            { ...assistantItem, chatId },
          ])
        }

        const result = await sendMessage(
          {
            chatId: chatId ?? undefined,
            text,
          },
          {
            onEvent: (event) => {
              if (event.chat) {
                const eventChatId = event.chat.id
                streamedChatId = eventChatId
                upsertChatInSidebar(event.chat)

                queryClient.setQueryData<MessageDto[]>(['chat-messages', eventChatId], (prev) => {
                  const base = prev ?? []
                  if (base.length > 0) {
                    return base
                  }
                  return [
                    { ...userItem, chatId: eventChatId },
                    { ...assistantItem, chatId: eventChatId },
                  ]
                })

                if (!chatId) {
                  navigate(`/chats/${eventChatId}`, { replace: true })
                }
              }

              const targetChatId = streamedChatId ?? chatId
              if (!targetChatId || (!event.textDelta && !event.sources && !event.message)) {
                return
              }

              queryClient.setQueryData<MessageDto[]>(['chat-messages', targetChatId], (prev) => {
                const { next, assistantIndex } = ensureAssistantMessage(prev ?? [], targetChatId)
                const currentAssistant = next[assistantIndex]
                const currentText = currentAssistant.text ?? ''
                const nextTextFromMessage = event.message?.text ?? currentText
                const mergedText = event.textDelta ? `${currentText}${event.textDelta}` : nextTextFromMessage

                next[assistantIndex] = {
                  ...currentAssistant,
                  ...(event.message ?? {}),
                  chatId: targetChatId,
                  aiGenerated: true,
                  text: mergedText,
                  sourceReferences: event.message?.sourceReferences,
                }
                return next
              })
            },
          },
        )

        const resolvedChatId = result.chat?.id ?? streamedChatId
        if (result.chat) {
          upsertChatInSidebar(result.chat)
        }
        if (!chatId && result.chat?.id) {
          navigate(`/chats/${result.chat.id}`, { replace: true })
        }
        if (resolvedChatId) {
          queryClient.setQueryData<MessageDto[]>(['chat-messages', resolvedChatId], (prev) => {
            const { next, assistantIndex } = ensureAssistantMessage(prev ?? [], resolvedChatId)
            const mergedRefs =
              result.sources?.length
                ? result.sources
                : result.message.sourceReferences ?? result.message.sources
            next[assistantIndex] = {
              ...next[assistantIndex],
              ...result.message,
              chatId: resolvedChatId,
              aiGenerated: true,
              text: result.answer || next[assistantIndex].text,
              sourceReferences:
                mergedRefs && mergedRefs.length > 0
                  ? mergedRefs
                  : next[assistantIndex].sourceReferences,
            }
            return next
          })
        }
      } catch (err) {
        console.error('Send message failed:', err)
        if (!chatId) {
          setDraftMessages(null)
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [chatId, hasDocuments, isSubmitting, queryClient, navigate],
  )

  const canSubmit =
    (!scopesLoading && scopes.length > 0) &&
    !isSubmitting &&
    !isDeleting

  const handleDeleteChat = useCallback(async () => {
    if (!chatId) {
      return
    }
    const confirmed = window.confirm(t('chat.deleteConfirm'))
    if (!confirmed) {
      return
    }
    setIsDeleting(true)
    try {
      await deleteChat(chatId)
      queryClient.invalidateQueries({ queryKey: ['chats', 20] })
      queryClient.removeQueries({ queryKey: ['chat', chatId] })
      queryClient.removeQueries({ queryKey: ['chat-messages', chatId] })
      navigate('/chats')
    } catch (error) {
      console.error('Delete chat failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [chatId, navigate, queryClient, t])

  if (chatsLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center" aria-busy="true">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  const showConversation =
    Boolean(chatId) || Boolean(draftMessages && draftMessages.length > 0)

  return (
    <>
      <ChatSidebar
        className="col-start-1 col-end-2 row-start-1 row-end-3"
        chats={chats}
        activeChatId={chatId}
        onSelectChat={handleSelectChat}
      />
      <div className="col-start-2 col-end-3 row-start-1 row-end-2 flex min-h-0 flex-1 flex-col">
        {chatData && (
          <ChatHeading
            chat={chatData}
            showShare={showShare}
            isDeleting={isDeleting}
            setShowShare={setShowShare}
            handleDeleteChat={handleDeleteChat}
            className="border-b border-muted pb-3"
          />
        )}
        {showConversation && (
          <CreatedChatInteractionView
            messages={displayMessages}
            documentsById={documentsById}
            handleSubmit={handleSubmit}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
          />
        )}
        {!showConversation && (
          <NewChatBlock
            handleSubmit={handleSubmit}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
            hasDocuments={hasDocuments}
          />
        )}
      </div>
    </>
  )
}
