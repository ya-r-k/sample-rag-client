import type { MessageGenerationStepItem } from '../../../shared/store/message-generation-steps-store'

export type MessageGenerationStepsProps = {
  messageId: string | undefined
  steps: MessageGenerationStepItem[]
  isStreaming: boolean
  streamPhase: 'pre_answer' | 'final_answer' | undefined
  trackKey: string
}
