import { cn } from '../../../shared/lib/cn'

export type ChatListItemProps = {
  id: string
  title: string
  isActive?: boolean
  onClick: () => void
  className?: string
}

/**
 * Single chat entry in the sidebar list. Displays chat title; click selects chat.
 */
export function ChatListItem({
  id,
  title,
  isActive = false,
  onClick,
  className,
}: ChatListItemProps) {
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
      aria-label={title || 'New chat'}
    >
      <span className="block truncate" title={title}>
        {title || 'New chat'}
      </span>
    </button>
  )
}
