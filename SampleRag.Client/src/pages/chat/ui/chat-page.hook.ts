import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMessagesFilter, type MessageDto } from '../../../shared/api/messages'
import { getDocumentsByIds, type DocumentDto } from '../../../shared/api/documents'
import { useTranslation } from 'react-i18next'
import { useChatsStore } from '../../../shared/store/chats-store'
import { useMessagesStore } from '../../../shared/store/messages-store'
import { submitChatMessage } from './submit-chat-message'
import { deleteChatFlow } from './delete-chat'

const EMPTY_MESSAGES: MessageDto[] = []

export function useChatPage() {
  const { t } = useTranslation()
  const { chatId } = useParams<{ chatId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [hasDocuments] = useState(true)

  const displayMessages = useMessagesStore((s) =>
    chatId ? (s.byChatId[chatId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES,
  )

  const {
    data: messagesQueryData,
    dataUpdatedAt: messagesDataUpdatedAt,
  } = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: () => getMessagesFilter({ chatId: chatId ?? undefined, batchSize: 30 }),
    enabled: !!chatId && !isSubmitting,
  })

  useEffect(() => {
    if (!chatId || isSubmitting || messagesQueryData === undefined) {
      return
    }
    useMessagesStore.getState().setMessagesForChat(chatId, messagesQueryData)
    useChatsStore.getState().setChatLastLoadedAt(chatId, Date.now())
  }, [chatId, messagesQueryData, messagesDataUpdatedAt, isSubmitting])

  const documentIds = useMemo(() => {
    const set = new Set<string>()
    for (const m of displayMessages) {
      for (const s of m.sourceReferences ?? []) {
        if (s.documentId) set.add(s.documentId)
      }
    }
    return [...set].sort()
  }, [displayMessages])

  const { data: loadedDocuments = [] } = useQuery({
    queryKey: ['chat-documents-by-ids', documentIds.join('|')],
    queryFn: () => getDocumentsByIds(documentIds),
    enabled: documentIds.length > 0,
    staleTime: 60_000,
  })

  const documentsById = useMemo(
    () => Object.fromEntries(loadedDocuments.map((d: DocumentDto) => [d.id, d])),
    [loadedDocuments],
  )

  const handleSubmit = useCallback(
    (currentChatId: string | null, pickedScopeId: string | null, text: string) =>
      submitChatMessage(
        {
          isSubmitting,
          hasDocuments,
          setIsSubmitting,
          navigate,
          t,
          routeChatId: chatId,
        },
        currentChatId,
        pickedScopeId,
        text,
      ),
    [chatId, hasDocuments, isSubmitting, navigate, t],
  )

  const handleDeleteChat = useCallback(
    (id: string) =>
      deleteChatFlow(
        { queryClient, navigate, t, setIsDeleting },
        id,
      ),
    [navigate, queryClient, t],
  )

  const canSubmit = !isSubmitting && !isDeleting
  const showConversation = Boolean(chatId)

  return {
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
  }
}
