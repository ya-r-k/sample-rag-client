import type { Source } from '../../../entities/chat/model/types'
import { CitationLink } from '../../../entities/chat/ui/citation-link'
import { ScrollArea } from '../../../shared/ui/scroll-area'
import { cn } from '../../../shared/lib/cn'
import { MessageDto } from '../../../shared/api/messages'
import type { DocumentDto } from '../../../shared/api/documents'

export type MessageItem = {
  role: 'user' | 'assistant'
  text: string
  sources?: Source[]
}

type MessageListProps = {
  messages: MessageDto[]
  documentsById?: Record<string, DocumentDto>
  className?: string
}

export function MessageList({ messages, documentsById, className }: MessageListProps) {
  return (
    <ScrollArea className={cn('flex-1', className)}>
      <ul className="flex flex-col gap-4 p-4">
        {messages.map((msg) => (
          <li
            key={msg.id}
            className={cn(
              'flex',
              msg.aiGenerated === false ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-4 py-2 text-sm',
                msg.aiGenerated === false
                  ? 'bg-sky-600 text-white'
                  : 'bg-muted text-foreground',
              )}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.aiGenerated === true && msg.sourceReferences && msg.sourceReferences.length > 0 && (
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
        ))}
      </ul>
    </ScrollArea>
  )
}
