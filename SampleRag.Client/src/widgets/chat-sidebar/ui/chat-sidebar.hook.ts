import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getChats } from '../../../shared/api/chats'
import { useChatsStore } from '../../../shared/store/chats-store'

const CHATS_QUERY_KEY = ['chats', 20] as const

export function useChatSidebar() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const chats = useChatsStore((s) => s.chats)

  const { data: chatsQueryData, dataUpdatedAt } = useQuery({
    queryKey: CHATS_QUERY_KEY,
    queryFn: () => getChats({ batchSize: 20 }),
  })

  useEffect(() => {
    if (chatsQueryData !== undefined) {
      useChatsStore.getState().mergeChatsFromServer(chatsQueryData)
    }
  }, [chatsQueryData, dataUpdatedAt])

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return chats
    }
    return chats.filter((chat) => chat.name.toLowerCase().includes(query))
  }, [chats, search])

  const handleSelectChat = useCallback(
    (id: string) => {
      navigate(`/chats/${id}`)
    },
    [navigate],
  )

  return {
    t,
    search,
    setSearch,
    filteredChats,
    hasChats: chats.length > 0,
    hasResults: filteredChats.length > 0,
    handleSelectChat,
  }
}
