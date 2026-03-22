import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChatListItem } from './chat-list-item'
import { ChatDto } from '../../../shared/api/chats'
import { ScrollArea } from '../../../shared/ui/scroll-area'
import { cn } from '../../../shared/lib/cn'
import { Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import logo from '../../../assets/logo.svg'

export type ChatSidebarProps = {
  chats: ChatDto[]
  activeChatId: string | undefined
  onSelectChat: (chatId: string) => void
  className?: string
}

/**
 * Sidebar listing user's chats. Fetches GET /api/chats; selecting an item loads that chat.
 * Supports client-side search by chat title with empty-state messaging.
 */
export function ChatSidebar({
  chats,
  activeChatId,
  onSelectChat,
  className,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const { t } = useTranslation()

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return chats
    }
    return chats.filter((chat) => chat.name.toLowerCase().includes(query))
  }, [chats, search])

  const hasChats = chats.length > 0
  const hasResults = filteredChats.length > 0

  return (
    <div
      className={cn('w-full h-full max-w-full max-h-full scrollbar-thin scrollbar-track-muted scrollbar-thumb-sky-700 border-r border-muted bg-muted/30 flex flex-col', className)}
      aria-label={t('chatSidebar.ariaLabel')}
    >
      <div className="shrink-0 border-b border-muted px-3 py-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className={cn(
              'my-3 ml-1 text-base font-semibold tracking-wide transition-colors hover:text-foreground/90 flex items-center gap-2',
              location.pathname === '/' ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <img src={logo} alt={t('common.logoAlt')} className="h-6 w-6" />
            {t('appName')}
          </Link>
        </div>
        <div>
          <Link
              to="/chats"
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-md border border-muted bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
            <Plus className="h-3 w-3" />
            <span>{t('chatSidebar.newChat')}</span>
          </Link>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('chatSidebar.searchPlaceholder')}
            className="w-full rounded-md border border-input bg-background pl-7 pr-2 py-1 text-xs text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>
      </div>
      <ScrollArea className="max-h-full h-full">
        <nav className="flex flex-col gap-0.5 p-2">
          {!hasChats ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t('chatSidebar.empty')}
            </div>
          ) : !hasResults ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t('chatSidebar.noResults')}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                id={chat.id}
                title={chat.name}
                fallbackTitle={t('chat.newChatName')}
                isActive={activeChatId === chat.id}
                onClick={() => onSelectChat(chat.id)}
              />
            ))
          )}
        </nav>
      </ScrollArea>
    </div>
  )
}
