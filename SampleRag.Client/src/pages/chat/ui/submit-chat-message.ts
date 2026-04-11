import type { NavigateFunction } from 'react-router-dom'
import type { TFunction } from 'i18next'
import {
  sendMessage,
  GenerationStep,
  type MessagePartResponse,
} from '../../../shared/api/messages'
import { useChatsStore } from '../../../shared/store/chats-store'
import { useMessagesStore } from '../../../shared/store/messages-store'
import { useMessageGenerationStepsStore } from '../../../shared/store/message-generation-steps-store'

export type ChatPageSubmitDeps = {
  isSubmitting: boolean
  hasDocuments: boolean
  setIsSubmitting: (value: boolean) => void
  navigate: NavigateFunction
  t: TFunction
}

function routeStreamEventToGenerationSteps(
  turnId: string,
  part: MessagePartResponse,
) {
  useMessageGenerationStepsStore.getState().appendStreamPart(turnId, part)
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
  const generationStepsStore = useMessageGenerationStepsStore.getState()

  setIsSubmitting(true)
  let resolvedChatId = chatId
  const turnId = crypto.randomUUID()
  if (resolvedChatId) {
    generationStepsStore.startTurn(turnId, resolvedChatId)
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
              generationStepsStore.startTurn(turnId, resolvedChatId)
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
            part.step === GenerationStep.ToolResult ||
            part.step === GenerationStep.ResponseMessage
          ) {
            routeStreamEventToGenerationSteps(turnId, part)
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

    if (resolvedChatId) {
      messagesStore.finalizeSendResponse(resolvedChatId, result)
      const messagesAfter = useMessagesStore.getState().byChatId[resolvedChatId] ?? []
      const assistantMessageId =
        result.message?.id ??
        [...messagesAfter].reverse().find((m) => m.aiGenerated)?.id
      if (assistantMessageId) {
        generationStepsStore.commitTurnToMessage(turnId, assistantMessageId)
      } else {
        generationStepsStore.clearTurn(turnId)
      }
      generationStepsStore.finishTurn(turnId)
    }
  } catch (err) {
    console.error('Send message failed:', err)
    generationStepsStore.clearTurn(turnId)
  } finally {
    setIsSubmitting(false)
    void t
  }
}
