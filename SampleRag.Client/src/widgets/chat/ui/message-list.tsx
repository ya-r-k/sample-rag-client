import { ScrollArea } from '../../../shared/ui/scroll-area'
import { cn } from '../../../shared/lib/cn'
import { AssistantMessageTurn } from './assistant-message-turn'
import type { MessageListProps } from './message-list.props'

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
            <AssistantMessageTurn
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
