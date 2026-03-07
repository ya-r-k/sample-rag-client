import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getChats } from '../../../shared/api/chats'
import { ChatListItem } from './chat-list-item'
import { ScrollArea } from '../../../shared/ui/scroll-area'
import { cn } from '../../../shared/lib/cn'
import { Plus } from 'lucide-react'

export type ChatSidebarProps = {
  activeChatId: string | null
  onSelectChat: (chatId: string) => void
  className?: string
}

/**
 * Sidebar listing user's chats. Fetches GET /api/chats; selecting an item loads that chat.
 */
export function ChatSidebar({
  activeChatId,
  onSelectChat,
  className,
}: ChatSidebarProps) {
  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => getChats(),
  })

  return (
    <aside
      className={cn('flex w-56 shrink-0 flex-col border-r border-muted bg-muted/30', className)}
      aria-label="Chat list"
    >
      <div className="shrink-0 border-b border-muted px-3 py-2 space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Chats</h2>
        <Link
          to="/chats"
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-md border border-muted bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <Plus className="h-4 w-4" />
          New chat
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-0.5 p-2">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
          ) : (
            chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                id={chat.id}
                title={chat.title}
                isActive={activeChatId === chat.id}
                onClick={() => onSelectChat(chat.id)}
              />
            ))
          )}
        </nav>
      </ScrollArea>
    </aside>
  )
}
