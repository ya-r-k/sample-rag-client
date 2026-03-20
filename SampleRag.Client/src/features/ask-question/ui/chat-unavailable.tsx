import { cn } from '../../../shared/lib/cn'

type ChatUnavailableProps = {
  reason?: string
  className?: string
}

/**
 * Unavailable-state message when no documents are available for chat.
 * Matches UX-006: clear explanation, encourages user to add documents or change scope.
 */
export function ChatUnavailable({ reason, className }: ChatUnavailableProps) {
  return (
    <div
      className={cn(
        'mt-3 rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100',
        className,
      )}
      role="status"
    >
      <p className="font-medium">Chat is unavailable.</p>
      <p className="mt-1">
        There are no documents available for the selected scope. Add documents or choose a different
        scope to start asking questions.
      </p>
      {reason && <p className="mt-1 text-amber-800 dark:text-amber-200">{reason}</p>}
    </div>
  )
}

