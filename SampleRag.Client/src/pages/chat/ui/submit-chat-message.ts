import type { NavigateFunction } from 'react-router-dom'
import type { TFunction } from 'i18next'
import {
  sendMessage,
  GenerationStep,
  type MessagePartResponse,
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
  part: MessagePartResponse,
) {
  const { appendArtifact } = useStreamArtifactsStore.getState()
  switch (part.step) {
    case GenerationStep.AiThinking:
      if (part.text) {
        appendArtifact(chatId, turnId, {
          type: 'reasoning',
          text: part.text,
        })
      }
      break
    case GenerationStep.ToolUsing:
      if (part.toolsCalls?.length) {
        appendArtifact(chatId, turnId, {
          type: 'tool',
          text: part.text,
          payload: part.toolsCalls,
        })
      }
      break
    case GenerationStep.ToolResult:
      if (part.toolsResults?.length) {
        appendArtifact(chatId, turnId, {
          type: 'tool',
          text: part.text,
          payload: part.toolsResults,
        })
      }
      break
    default:
      break
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

    await sendMessage(
      {
        chatId: chatId ?? undefined,
        scopeId,
        text,
      },
      {
        onEvent: (part) => {
          if (
            part.step === GenerationStep.NewChatName &&
            part.text &&
            part.newChatId
          ) {
            const hadNoChatId = !resolvedChatId
            resolvedChatId = part.newChatId

            chatsStore.upsertChat({
              id: resolvedChatId,
              name: part.text || t('chat.newChatName'),
              scopeId,
              ownerIds: [],
            })

            if (hadNoChatId) {
              artifactsStore.startTurn(resolvedChatId, turnId)
              navigate(`/chats/${resolvedChatId}`, { replace: true })
            }

            messagesStore.seedMessagesIfEmpty(resolvedChatId, text)
          }

          if (!resolvedChatId) {
            return
          }

          if (
            part.step === GenerationStep.AiThinking ||
            part.step === GenerationStep.ToolUsing ||
            part.step === GenerationStep.ToolResult
          ) {
            routeStreamEventToArtifacts(resolvedChatId, turnId, part)
          }

          if (
            part.step === GenerationStep.ResponseMessage &&
            part.text !== undefined
          ) {
            messagesStore.applyMessagePart(resolvedChatId, part, text)
          }
        },
      },
    )
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
