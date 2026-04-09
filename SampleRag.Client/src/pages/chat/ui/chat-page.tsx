import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteChat } from '../../../shared/api/chats'
import {
  sendMessage,
  getMessagesFilter,
  type MessageDto,
  type SendMessageStreamEvent,
} from '../../../shared/api/messages'
import { getDocumentsByIds, type DocumentDto } from '../../../shared/api/documents'
import { ChatSidebar } from '../../../widgets/chat-sidebar/ui/chat-sidebar'
import { ChatHeading } from '../../../widgets/chat/ui/chat-heading'
import { NewChatBlock } from '../../../widgets/chat/ui/new-chat-block'
import { CreatedChatInteractionView } from '../../../widgets/chat/ui/created-chat-interaction-view'
import { useTranslation } from 'react-i18next'
import { useChatsStore } from '../../../shared/store/chats-store'
import { useMessagesStore } from '../../../shared/store/messages-store'
import { useStreamArtifactsStore } from '../../../shared/store/stream-artifacts-store'

const EMPTY_MESSAGES: MessageDto[] = []
const CHATS_QUERY_KEY = ['chats', 20] as const
const DEFAULT_SCOPE_ID = 'ec642690-aa62-4c9b-8b9a-dc35badac4cd'

function routeStreamEventToArtifacts(
  streamChatId: string,
  turnId: string,
  event: SendMessageStreamEvent,
) {
  const { appendArtifact } = useStreamArtifactsStore.getState()
  if (event.reasoningDelta) {
    appendArtifact(streamChatId, turnId, {
      type: 'reasoning',
      text: event.reasoningDelta,
    })
  }
  if (event.retrievalDelta) {
    appendArtifact(streamChatId, turnId, {
      type: 'retrieval',
      text: event.retrievalDelta,
    })
  }
  if (event.streamArtifact) {
    const a = event.streamArtifact
    appendArtifact(streamChatId, turnId, {
      type: a.type,
      text: a.text,
      payload: a.payload,
      at: a.at,
    })
  }
  if (event.streamArtifacts) {
    for (const a of event.streamArtifacts) {
      appendArtifact(streamChatId, turnId, {
        type: a.type,
        text: a.text,
        payload: a.payload,
        at: a.at,
      })
    }
  }
}

export function ChatPage() {
  const { t } = useTranslation()
  const { chatId } = useParams<{ chatId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [hasDocuments] = useState(true)
  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(DEFAULT_SCOPE_ID)

  const chats = useChatsStore((s) => s.chats)
  const displayMessages = useMessagesStore((s) =>
    chatId ? (s.byChatId[chatId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES,
  )

  const {
    data: messagesQueryData,
    dataUpdatedAt: messagesDataUpdatedAt,
  } = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: () => getMessagesFilter({ chatId: chatId ?? undefined, batchSize: 30 }),
    enabled: !!chatId && !isSubmitting,
  })

  useEffect(() => {
    if (!chatId || isSubmitting || messagesQueryData === undefined) {
      return
    }
    useMessagesStore.getState().setMessagesForChat(chatId, messagesQueryData)
    useChatsStore.getState().setChatLastLoadedAt(chatId, Date.now())
  }, [chatId, messagesQueryData, messagesDataUpdatedAt, isSubmitting])

  const chatData = useMemo(
    () => (chatId ? chats.find((c) => c.id === chatId) ?? null : null),
    [chats, chatId],
  )

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
  useEffect(() => {
    if (chatData?.scopeId) {
      setSelectedScopeId(chatData.scopeId)
      return
    }
    if (!chatId) {
      setSelectedScopeId(DEFAULT_SCOPE_ID)
    }
  }, [chatData?.scopeId, chatId])

  const handleSubmit = useCallback(
    async (text: string, pickedScopeId: string | null) => {
      if (isSubmitting) return
      if (!hasDocuments && !chatId) return
      const nextScopeId = pickedScopeId ?? selectedScopeId ?? DEFAULT_SCOPE_ID

      const chatsStore = useChatsStore.getState()
      const messagesStore = useMessagesStore.getState()
      const artifactsStore = useStreamArtifactsStore.getState()

      setIsSubmitting(true)
      const optimisticChatId = !chatId ? crypto.randomUUID() : null
      let streamChatId = chatId ?? optimisticChatId!
      const streamChatIdRef = { current: streamChatId }
      const optimisticResolvedRef = { current: false }
      const turnId = crypto.randomUUID()

      artifactsStore.startTurn(streamChatId, turnId)

      if (optimisticChatId) {
        const title =
          text.trim().slice(0, 80) || t('chat.newChatName')
        chatsStore.upsertChat(
          {
            id: optimisticChatId,
            name: title,
            scopeId: nextScopeId,
            ownerIds: [],
          },
          { clientOptimistic: true },
        )
        messagesStore.setOptimisticTurn(optimisticChatId, text)
        navigate(`/chats/${optimisticChatId}`, { replace: true })
      }

      try {
        if (chatId) {
          messagesStore.appendUserAndAssistantPlaceholders(chatId, text)
        }

        const result = await sendMessage(
          {
            chatId: chatId ?? undefined,
            scopeId: nextScopeId,
            text,
          },
          {
            onEvent: (event) => {
              routeStreamEventToArtifacts(streamChatIdRef.current, turnId, event)

              if (event.chat) {
                const eventChatId = event.chat.id
                streamChatId = eventChatId
                streamChatIdRef.current = eventChatId

                if (optimisticChatId) {
                  optimisticResolvedRef.current = true
                  chatsStore.replaceChatId(optimisticChatId, event.chat)
                  messagesStore.renameChatId(optimisticChatId, eventChatId)
                  artifactsStore.rebindTurnChatId(
                    optimisticChatId,
                    eventChatId,
                    turnId,
                  )
                  navigate(`/chats/${eventChatId}`, { replace: true })
                } else {
                  chatsStore.upsertChat(event.chat)
                }

                messagesStore.seedMessagesIfEmpty(eventChatId, text)
              }

              const targetChatId = streamChatIdRef.current
              if (
                !targetChatId ||
                (!event.textDelta &&
                  !event.sources &&
                  !event.message &&
                  !event.reasoningDelta &&
                  !event.retrievalDelta &&
                  !event.streamArtifact &&
                  !event.streamArtifacts)
              ) {
                return
              }

              if (
                event.textDelta ||
                event.sources ||
                event.message
              ) {
                messagesStore.applyStreamEvent(targetChatId, event, text)
              }
            },
          },
        )

        if (
          optimisticChatId &&
          result.chat?.id &&
          !optimisticResolvedRef.current
        ) {
          const realId = result.chat.id
          chatsStore.replaceChatId(optimisticChatId, result.chat)
          messagesStore.renameChatId(optimisticChatId, realId)
          artifactsStore.rebindTurnChatId(optimisticChatId, realId, turnId)
          streamChatIdRef.current = realId
          navigate(`/chats/${realId}`, { replace: true })
        }

        const streamedChatId = result.chat?.id ?? streamChatIdRef.current
        if (result.chat) {
          chatsStore.upsertChat(result.chat)
        }
        if (!chatId && result.chat?.id && !optimisticChatId) {
          navigate(`/chats/${result.chat.id}`, { replace: true })
        }
        if (streamedChatId) {
          messagesStore.finalizeSendResponse(streamedChatId, result)
        }

        artifactsStore.clearTurn(streamChatIdRef.current, turnId)
      } catch (err) {
        console.error('Send message failed:', err)
        artifactsStore.clearTurn(streamChatIdRef.current, turnId)
        if (optimisticChatId) {
          chatsStore.removeChat(optimisticChatId)
          messagesStore.removeMessagesForChat(optimisticChatId)
          artifactsStore.clearChatArtifacts(optimisticChatId)
          navigate('/chats', { replace: true })
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [chatId, hasDocuments, isSubmitting, navigate, selectedScopeId, t],
  )

  const canSubmit = !isSubmitting && !isDeleting

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
      queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY })
      queryClient.removeQueries({ queryKey: ['chat', chatId] })
      queryClient.removeQueries({ queryKey: ['chat-messages', chatId] })
      useChatsStore.getState().removeChat(chatId)
      useMessagesStore.getState().removeMessagesForChat(chatId)
      useStreamArtifactsStore.getState().clearChatArtifacts(chatId)
      navigate('/chats')
    } catch (error) {
      console.error('Delete chat failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [chatId, navigate, queryClient, t])

  const showConversation = Boolean(chatId)

  return (
    <>
      <ChatSidebar
        className="col-start-1 col-end-2 row-start-1 row-end-3"
        activeChatId={chatId}
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
            chatId={chatId!}
            messages={displayMessages}
            documentsById={documentsById}
            handleSubmit={handleSubmit}
            scopeId={selectedScopeId}
            onScopeIdChange={setSelectedScopeId}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
          />
        )}
        {!showConversation && (
          <NewChatBlock
            handleSubmit={handleSubmit}
            scopeId={selectedScopeId}
            onScopeIdChange={setSelectedScopeId}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
            hasDocuments={hasDocuments}
          />
        )}
      </div>
    </>
  )
}
