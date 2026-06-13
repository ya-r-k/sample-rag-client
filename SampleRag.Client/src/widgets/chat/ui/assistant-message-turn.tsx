import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { CitationLink } from '../../../entities/chat/ui/citation-link'
import { cn } from '../../../shared/lib/cn'
import { MessageGenerationSteps } from './message-generation-steps'
import type { AssistantMessageTurnProps } from './assistant-message-turn.props'
import { useStepsForAssistantMessage } from './use-steps-for-assistant-message.hook'

/** One assistant reply: optional live generation steps, then the answer bubble (and citations). */
export function AssistantMessageTurn({
  msg,
  messageIndex,
  messages,
  documentsById,
  isSubmitting,
}: AssistantMessageTurnProps) {
  const { t } = useTranslation()
  const { steps, isStreaming, streamPhase, trackKey } = useStepsForAssistantMessage(
    msg.id,
    messageIndex,
    messages,
    isSubmitting,
  )

  const showSteps = steps.length > 0

  return (
    <Fragment>
      {showSteps && (
        <li className="flex justify-start">
          <MessageGenerationSteps
            messageId={msg.id}
            steps={steps}
            isStreaming={isStreaming}
            streamPhase={streamPhase}
            trackKey={trackKey}
          />
        </li>
      )}
      <li className={cn('flex justify-start')}>
        <div
          className={cn(
            'max-w-[85%] rounded-lg px-4 py-2 text-sm',
            'bg-muted text-foreground',
          )}
        >
          <p className="whitespace-pre-wrap">{msg.text}</p>
          {msg.usesOutdatedSources && (
            <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 dark:border-red-600/40 dark:bg-red-900/10 dark:text-red-200">
              {t('chat.outdatedMessageWarning')}
            </p>
          )}
          {msg.sourceReferences && msg.sourceReferences?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 border-t border-muted pt-2">
              {msg.sourceReferences.map((source, i) => (
                <CitationLink
                  key={`${source.documentId}-${source.pageNumber}-${i}`}
                  source={source}
                  document={documentsById?.[source.documentId]}
                  className="text-xs text-sky-600 underline hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                />
              ))}
            </div>
          )}
        </div>
      </li>
    </Fragment>
  )
}
