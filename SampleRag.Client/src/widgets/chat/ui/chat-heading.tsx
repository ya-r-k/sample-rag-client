import { cn } from '../../../shared/lib/cn'
import { ChatDto } from '../../../shared/api/chats'
import { ShareChatForm } from '../../../features/share-chat/ui/share-chat-form'
import { useTranslation } from 'react-i18next'

type ChatHeadingProps = {
  chat: ChatDto,
  showShare: boolean,
  isDeleting: boolean,
  setShowShare: (show: React.SetStateAction<boolean>) => void,
  handleDeleteChat: () => void,
  className?: string
}

export function ChatHeading({ chat, showShare, isDeleting, setShowShare, handleDeleteChat, className }: ChatHeadingProps) {
  const { t } = useTranslation()
  return (
    <div className={cn("shrink-0 border-b border-muted py-3 px-4 w-full", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">
            {chat?.name ?? t('chat.newChatName')}
          </h2>
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
            onClick={handleDeleteChat}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-md border border-destructive bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? t('chat.deleting') : t('chat.deleteChat')}
          </button>
        </div>
        {showShare && (
          <div className="w-64">
            <ShareChatForm chatId={chat.id} />
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
