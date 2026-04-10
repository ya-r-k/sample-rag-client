import { Fragment } from 'react'
import { CitationLink } from '../../../entities/chat/ui/citation-link'
import { ScrollArea } from '../../../shared/ui/scroll-area'
import { cn } from '../../../shared/lib/cn'
import { MessageDto } from '../../../shared/api/messages'
import type { DocumentDto } from '../../../shared/api/documents'
import {
  MessageGenerationSteps,
  useStepsForAssistantMessage,
} from './message-generation-steps'

type MessageListProps = {
  messages: MessageDto[]
  documentsById?: Record<string, DocumentDto>
  className?: string
  isSubmitting?: boolean
}

export function MessageList({
  messages,
  documentsById,
  className,
  isSubmitting = false,
}: MessageListProps) {
  return (
    <ScrollArea className={cn('flex-1', className)}>
      <ul className="flex flex-col gap-4 p-4">
        {messages.map((msg, idx) => {
          if (!msg.aiGenerated) {
            return (
              <li
                key={msg.id ?? `user-${idx}`}
                className={cn('flex justify-end')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-4 py-2 text-sm',
                    'bg-sky-600 text-white',
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </li>
            )
          }

          return (
            <AssistantTurn
              key={msg.id ?? `assistant-${idx}`}
              msg={msg}
              messageIndex={idx}
              messages={messages}
              documentsById={documentsById}
              isSubmitting={isSubmitting}
            />
          )
        })}
      </ul>
    </ScrollArea>
  )
}

function AssistantTurn({
  msg,
  messageIndex,
  messages,
  documentsById,
  isSubmitting,
}: {
  msg: MessageDto
  messageIndex: number
  messages: MessageDto[]
  documentsById?: Record<string, DocumentDto>
  isSubmitting: boolean
}) {
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
