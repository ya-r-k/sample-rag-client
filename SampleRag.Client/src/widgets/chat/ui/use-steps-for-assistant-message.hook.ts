import { useMemo } from 'react'
import {
  type MessageGenerationStepItem,
  useMessageGenerationStepsStore,
} from '../../../shared/store/message-generation-steps-store'

/** Stable fallback so Zustand selectors do not return a new `[]` every run (infinite re-renders). */
export const EMPTY_STEPS: MessageGenerationStepItem[] = []

export function useStepsForAssistantMessage(
  messageId: string | undefined,
  messageIndex: number,
  messages: { aiGenerated: boolean; id?: string }[],
  isSubmitting: boolean,
): {
  steps: MessageGenerationStepItem[]
  isStreaming: boolean
  streamPhase: 'pre_answer' | 'final_answer' | undefined
  trackKey: string
} {
  const activeTurnId = useMessageGenerationStepsStore((s) => s.activeTurnId)
  const pendingSteps = useMessageGenerationStepsStore((s) => {
    const id = s.activeTurnId
    if (!id) return EMPTY_STEPS
    return s.pendingByTurnId[id] ?? EMPTY_STEPS
  })
  const streamPhase = useMessageGenerationStepsStore((s) => {
    const id = s.activeTurnId
    if (!id) return undefined
    return s.streamPhaseByTurnId[id]
  })
  const storedForId = useMessageGenerationStepsStore((s) => {
    if (!messageId) return EMPTY_STEPS
    return s.byMessageId[messageId] ?? EMPTY_STEPS
  })

  return useMemo(() => {
    if (messageId && storedForId.length > 0) {
      return {
        steps: storedForId,
        isStreaming: false,
        streamPhase: undefined,
        trackKey: messageId,
      }
    }

    const isPlaceholderAssistant =
      isSubmitting &&
      activeTurnId &&
      (() => {
        const lastNoIdAi = [...messages]
          .map((m, i) => ({ m, i }))
          .filter(({ m }) => m.aiGenerated && !m.id)
          .pop()
        return lastNoIdAi?.i === messageIndex
      })()

    if (isPlaceholderAssistant && pendingSteps.length > 0) {
      return {
        steps: pendingSteps,
        isStreaming: true,
        streamPhase,
        trackKey: activeTurnId ?? `stream-${messageIndex}`,
      }
    }

    return {
      steps: EMPTY_STEPS,
      isStreaming: Boolean(isPlaceholderAssistant),
      streamPhase,
      trackKey: messageId ?? activeTurnId ?? `row-${messageIndex}`,
    }
  }, [
    messageId,
    messageIndex,
    messages,
    isSubmitting,
    activeTurnId,
    pendingSteps,
    streamPhase,
    storedForId,
  ])
}
