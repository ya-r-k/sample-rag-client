import { cn } from '../../../shared/lib/cn'
import { ShareChatForm } from '../../../features/share-chat/ui/share-chat-form'
import { useChatsStore } from '../../../shared/store/chats-store'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'

type ChatHeadingProps = {
  chatId: string,
  showShare: boolean,
  isDeleting: boolean,
  setShowShare: (show: React.SetStateAction<boolean>) => void,
  handleDeleteChat: (chatId: string) => void | Promise<void>,
  className?: string
}

export function ChatHeading({ chatId, showShare, isDeleting, setShowShare, handleDeleteChat, className }: ChatHeadingProps) {
  const { t } = useTranslation()
  const chats = useChatsStore((s) => s.chats)
  const chat = useMemo(
    () => chats.find((c) => c.id === chatId) ?? null,
    [chats, chatId],
  )

  return (
    <div className={cn("shrink-0 border-b border-muted py-3 px-4 w-full", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">
            {chat?.name ?? t('chat.newChatName')}
          </h2>
          {chat?.hasOutdatedSources && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 dark:border-red-600/40 dark:bg-red-900/10 dark:text-red-200">
              {t('chat.outdatedChatWarning')}
            </div>
          )}
        </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowShare((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md border border-muted bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {showShare ? t('chat.closeSharing') : t('chat.shareChat')}
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteChat(chatId)}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-md border border-destructive bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? t('chat.deleting') : t('chat.deleteChat')}
          </button>
        </div>
        {showShare && (
          <div className="w-64">
            <ShareChatForm chatId={chatId} />
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
