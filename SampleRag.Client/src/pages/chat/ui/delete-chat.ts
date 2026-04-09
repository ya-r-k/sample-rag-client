import type { NavigateFunction } from 'react-router-dom'
import type { TFunction } from 'i18next'
import type { QueryClient } from '@tanstack/react-query'
import { deleteChat } from '../../../shared/api/chats'
import { useChatsStore } from '../../../shared/store/chats-store'
import { useMessagesStore } from '../../../shared/store/messages-store'
import { useStreamArtifactsStore } from '../../../shared/store/stream-artifacts-store'

const CHATS_QUERY_KEY = ['chats', 20] as const

export type DeleteChatFlowDeps = {
  queryClient: QueryClient
  navigate: NavigateFunction
  t: TFunction
  setIsDeleting: (value: boolean) => void
}

export async function deleteChatFlow(
  deps: DeleteChatFlowDeps,
  chatId: string,
): Promise<void> {
  if (!chatId) {
    return
  }
  const { queryClient, navigate, t, setIsDeleting } = deps

  const confirmed = window.confirm(t('chat.deleteConfirm'))
  if (!confirmed) {
    return
  }

  setIsDeleting(true)
  try {
    await deleteChat(chatId)
    queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY })
    queryClient.removeQueries({ queryKey: ['chat', chatId] })
    queryClient.removeQueries({ queryKey: ['chat-messages', chatId] })
    useChatsStore.getState().removeChat(chatId)
    useMessagesStore.getState().removeMessagesForChat(chatId)
    useStreamArtifactsStore.getState().clearChatArtifacts(chatId)
    navigate('/chats')
  } catch (error) {
    console.error('Delete chat failed:', error)
  } finally {
    setIsDeleting(false)
  }
}
