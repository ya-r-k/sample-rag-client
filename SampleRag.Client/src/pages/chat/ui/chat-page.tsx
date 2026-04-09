import { ChatSidebar } from '../../../widgets/chat-sidebar/ui/chat-sidebar'
import { ChatHeading } from '../../../widgets/chat/ui/chat-heading'
import { NewChatBlock } from '../../../widgets/chat/ui/new-chat-block'
import { CreatedChatInteractionView } from '../../../widgets/chat/ui/created-chat-interaction-view'
import { useChatPage } from './chat-page.hook'

export function ChatPage() {
  const {
    chatId,
    displayMessages,
    documentsById,
    handleSubmit,
    handleDeleteChat,
    canSubmit,
    isSubmitting,
    hasDocuments,
    isDeleting,
    showShare,
    setShowShare,
    showConversation,
  } = useChatPage()

  return (
    <>
      <ChatSidebar
        className="col-start-1 col-end-2 row-start-1 row-end-3"
        activeChatId={chatId}
      />
      <div className="col-start-2 col-end-3 row-start-1 row-end-2 flex min-h-0 flex-1 flex-col">
        {chatId && (
          <ChatHeading
            chatId={chatId}
            showShare={showShare}
            isDeleting={isDeleting}
            setShowShare={setShowShare}
            handleDeleteChat={handleDeleteChat}
            className="border-b border-muted pb-3"
          />
        )}
        {showConversation && (
          <CreatedChatInteractionView
            chatId={chatId!}
            messages={displayMessages}
            documentsById={documentsById}
            handleSubmit={handleSubmit}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
          />
        )}
        {!showConversation && (
          <NewChatBlock
            handleSubmit={handleSubmit}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
            hasDocuments={hasDocuments}
          />
        )}
      </div>
    </>
  )
}
