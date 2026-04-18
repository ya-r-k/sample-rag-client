import { cn } from '../../../shared/lib/cn'
import { useChatListItem } from './chat-list-item.hook'

export type ChatListItemProps = {
  title: string
  fallbackTitle: string
  lastUpdatedAt?: string
  isActive?: boolean
  onClick: () => void
  className?: string
}

/**
 * Single chat entry in the sidebar list. Displays chat title and last activity; click selects chat.
 */
export function ChatListItem({
  title,
  fallbackTitle,
  lastUpdatedAt,
  isActive = false,
  onClick,
  className,
}: ChatListItemProps) {
  const { lastUpdatedLabel } = useChatListItem({ lastUpdatedAt })

  const displayTitle = title || fallbackTitle
  const aria =
    lastUpdatedLabel.length > 0
      ? `${displayTitle}, ${lastUpdatedLabel}`
      : displayTitle

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
        'hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isActive ? 'bg-muted text-foreground font-medium' : 'text-foreground',
        className,
      )}
      aria-current={isActive ? 'true' : undefined}
      aria-label={aria}
    >
      <span className="block truncate" title={title}>
        {displayTitle}
      </span>
      {lastUpdatedLabel.length > 0 ? (
        <span
          className="mt-0.5 block truncate text-xs text-muted-foreground"
          title={lastUpdatedLabel}
        >
          {lastUpdatedLabel}
        </span>
      ) : null}
    </button>
  )
}
