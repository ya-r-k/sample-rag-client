import type { NavigateFunction } from 'react-router-dom'
import type { TFunction } from 'i18next'
import {
  sendMessage,
  type SendMessageStreamEvent,
} from '../../../shared/api/messages'
import { useChatsStore } from '../../../shared/store/chats-store'
import { useMessagesStore } from '../../../shared/store/messages-store'
import { useStreamArtifactsStore } from '../../../shared/store/stream-artifacts-store'

export type ChatPageSubmitDeps = {
  isSubmitting: boolean
  hasDocuments: boolean
  setIsSubmitting: (value: boolean) => void
  navigate: NavigateFunction
  t: TFunction
}

function routeStreamEventToArtifacts(
  chatId: string,
  turnId: string,
  event: SendMessageStreamEvent,
) {
  const { appendArtifact } = useStreamArtifactsStore.getState()
  if (event.reasoningDelta) {
    appendArtifact(chatId, turnId, {
      type: 'reasoning',
      text: event.reasoningDelta,
    })
  }
  if (event.retrievalDelta) {
    appendArtifact(chatId, turnId, {
      type: 'retrieval',
      text: event.retrievalDelta,
    })
  }
  if (event.streamArtifact) {
    const a = event.streamArtifact
    appendArtifact(chatId, turnId, {
      type: a.type,
      text: a.text,
      payload: a.payload,
      at: a.at,
    })
  }
  if (event.streamArtifacts) {
    for (const a of event.streamArtifacts) {
      appendArtifact(chatId, turnId, {
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
  chatId: string | null,
  scopeId: string | null,
  text: string,
): Promise<void> {
  const {
    isSubmitting,
    hasDocuments,
    setIsSubmitting,
    navigate,
    t,
  } = deps

  if (isSubmitting) return
  if (!hasDocuments && !chatId) return
  if (!scopeId) return

  const chatsStore = useChatsStore.getState()
  const messagesStore = useMessagesStore.getState()
  const artifactsStore = useStreamArtifactsStore.getState()

  setIsSubmitting(true)
  let resolvedChatId = chatId
  const turnId = crypto.randomUUID()
  if (resolvedChatId) {
    artifactsStore.startTurn(resolvedChatId, turnId)
  }

  try {
    if (chatId) {
      messagesStore.appendUserAndAssistantPlaceholders(chatId, text)
    }

    const result = await sendMessage(
      {
        chatId: chatId ?? undefined,
        scopeId,
        text,
      },
      {
        onEvent: (event) => {

          console.log(resolvedChatId)
          console.log(event)
          if (event.chat) {
            const eventChatId = event.chat.id
            const hadNoChatId = !resolvedChatId
            resolvedChatId = eventChatId

            if (hadNoChatId) {
              artifactsStore.startTurn(eventChatId, turnId)
              navigate(`/chats/${eventChatId}`, { replace: true })
            }
            chatsStore.upsertChat(event.chat)

            messagesStore.seedMessagesIfEmpty(eventChatId, text)
          }

          const targetChatId = resolvedChatId
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
          routeStreamEventToArtifacts(targetChatId, turnId, event)

          if (event.textDelta || event.sources || event.message) {
            messagesStore.applyStreamEvent(targetChatId, event, text)
          }
        },
      },
    )

    const streamedChatId = result.chat?.id ?? resolvedChatId
    if (result.chat) {
      resolvedChatId = result.chat.id
      chatsStore.upsertChat(result.chat)
    }
    if (!chatId && result.chat?.id) {
      navigate(`/chats/${result.chat.id}`, { replace: true })
    }
    if (streamedChatId) {
      messagesStore.finalizeSendResponse(streamedChatId, result)
    }

    if (resolvedChatId) {
      artifactsStore.clearTurn(resolvedChatId, turnId)
    }
  } catch (err) {
    console.error('Send message failed:', err)
    if (resolvedChatId) {
      artifactsStore.clearTurn(resolvedChatId, turnId)
    }
  } finally {
    setIsSubmitting(false)
    void t
  }
}
