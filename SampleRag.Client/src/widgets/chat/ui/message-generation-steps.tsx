import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AiTool } from '../../../shared/api/messages'
import type { MessageGenerationStepItem } from '../../../shared/store/message-generation-steps-store'
import { MessageGenerationStepRow } from './message-generation-step-row'
import type { MessageGenerationStepsProps } from './message-generation-steps.props'
import { useMessageGenerationStepsExpansion } from './message-generation-steps.hook'
import { ReasoningStepBody } from './reasoning-step-body'
import { ToolStepPresentation } from './tool-step-presentation'
import { pickQuery } from '../lib/generation-step-arg-utils'

export function MessageGenerationSteps({
  messageId,
  steps,
  isStreaming,
  streamPhase,
  trackKey,
}: MessageGenerationStepsProps) {
  const { t } = useTranslation()
  const lastStepId = steps[steps.length - 1]?.id
  const { expanded, toggle } = useMessageGenerationStepsExpansion(
    isStreaming,
    streamPhase,
    lastStepId,
  )

  const summaryFor = useCallback(
    (item: MessageGenerationStepItem): string => {
      if (item.kind === 'reasoning') {
        return t('generationSteps.reasoningSummary')
      }
      switch (item.tool) {
        case AiTool.InternalDocumentData: {
          const q = pickQuery(item.arguments)
          return q
            ? t('generationSteps.searchDocsWithQuery', { query: q })
            : t('generationSteps.searchDocs')
        }
        case AiTool.CurrentTime:
          return t('generationSteps.currentTime')
        default:
          return t('generationSteps.unknownTool')
      }
    },
    [t],
  )

  if (steps.length === 0) {
    return null
  }

  return (
    <div
      className="w-full max-w-[85%] rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
      data-message-id={messageId}
      data-track={trackKey}
    >
      <ul className="flex flex-col gap-1">
        {steps.map((item) => {
          const open = expanded.has(item.id)
          return (
            <MessageGenerationStepRow
              key={item.id}
              id={item.id}
              summary={summaryFor(item)}
              open={open}
              onToggle={() => toggle(item.id)}
            >
              {item.kind === 'reasoning' ? (
                <ReasoningStepBody text={item.text} />
              ) : (
                <ToolStepPresentation item={item} t={t} />
              )}
            </MessageGenerationStepRow>
          )
        })}
      </ul>
    </div>
  )
}
