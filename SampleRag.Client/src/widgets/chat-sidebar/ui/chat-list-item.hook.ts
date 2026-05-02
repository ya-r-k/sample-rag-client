import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatChatLastUpdated } from '../../../shared/lib/format-chat-last-updated'

export type ChatListItemHookProps = {
  lastUpdatedAt?: string
}

export function useChatListItem({ lastUpdatedAt }: ChatListItemHookProps) {
  const { t, i18n } = useTranslation()
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!lastUpdatedAt) return
    const id_ = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(id_)
  }, [lastUpdatedAt])

  const lastUpdatedLabel = useMemo(
    () =>
      formatChatLastUpdated(
        lastUpdatedAt,
        new Date(nowMs),
        t,
        i18n.resolvedLanguage ?? i18n.language,
      ),
    [lastUpdatedAt, nowMs, t, i18n.resolvedLanguage, i18n.language],
  )

  return {
    t,
    lastUpdatedLabel,
  }
}
