import type { NavigateFunction } from 'react-router-dom'
import type { TFunction } from 'i18next'
import {
  sendMessage,
  type SendMessageStreamEvent,
} from '../../../shared/api/messages'
import { useChatsStore } from '../../../shared/store/chats-store'
import { useMessagesStore } from '../../../shared/store/messages-store'
import { useStreamArtifactsStore } from '../../../shared/store/stream-artifacts-store'

const DEFAULT_SCOPE_ID = 'ec642690-aa62-4c9b-8b9a-dc35badac4cd'

export type ChatPageSubmitDeps = {
  isSubmitting: boolean
  hasDocuments: boolean
  setIsSubmitting: (value: boolean) => void
  navigate: NavigateFunction
  t: TFunction
  routeChatId: string | undefined
}

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

export async function submitChatMessage(
  deps: ChatPageSubmitDeps,
  currentChatId: string | null,
  pickedScopeId: string | null,
  text: string,
): Promise<void> {
  const {
    isSubmitting,
    hasDocuments,
    setIsSubmitting,
    navigate,
    t,
    routeChatId,
  } = deps

  if (isSubmitting) return
  if (!hasDocuments && !currentChatId) return
  const nextScopeId = pickedScopeId ?? DEFAULT_SCOPE_ID

  const chatsStore = useChatsStore.getState()
  const messagesStore = useMessagesStore.getState()
  const artifactsStore = useStreamArtifactsStore.getState()

  setIsSubmitting(true)
  const optimisticChatId = !currentChatId ? crypto.randomUUID() : null
  let streamChatId = currentChatId ?? optimisticChatId!
  const streamChatIdRef = { current: streamChatId }
  const optimisticResolvedRef = { current: false }
  const turnId = crypto.randomUUID()

  artifactsStore.startTurn(streamChatId, turnId)

  if (optimisticChatId) {
    const title = text.trim().slice(0, 80) || t('chat.newChatName')
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
    if (currentChatId) {
      messagesStore.appendUserAndAssistantPlaceholders(currentChatId, text)
    }

    const result = await sendMessage(
      {
        chatId: currentChatId ?? undefined,
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
              artifactsStore.rebindTurnChatId(optimisticChatId, eventChatId, turnId)
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

          if (event.textDelta || event.sources || event.message) {
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
    if (!routeChatId && result.chat?.id && !optimisticChatId) {
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
}
