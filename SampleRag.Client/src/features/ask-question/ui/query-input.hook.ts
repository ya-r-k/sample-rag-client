import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMessageSubmissionStore } from '../../../shared/store/message-submission-store'
import { useChatsStore } from '../../../shared/store/chats-store'
import { QueryInputProps } from './query-input.props'

export const DEFAULT_SCOPE_ID = 'ec642690-aa62-4c9b-8b9a-dc35badac4cd'

const ESTIMATED_DROPDOWN_PX = 240

export function useQueryInput({
  onSubmit,
  chatId = null,
  disabled = false,
  placeholder,
  className,
}: QueryInputProps) {
  const { t } = useTranslation()
  const text = useMessageSubmissionStore((s) => s.text)
  const setText = useMessageSubmissionStore((s) => s.setText)
  const setForm = useMessageSubmissionStore((s) => s.setForm)

  const chats = useChatsStore((s) => s.chats)
  const chatScopeId = useMemo(
    () => (chatId ? chats.find((c) => c.id === chatId)?.scopeId ?? null : null),
    [chats, chatId],
  )

  const [scopeId, setScopeId] = useState<string | null>(DEFAULT_SCOPE_ID)
  const [flipOptionsUp, setFlipOptionsUp] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const effectivePlaceholder = placeholder ?? t('chat.placeholderAsk')

  useEffect(() => {
    if (chatScopeId) {
      setScopeId(chatScopeId)
    }
  }, [chatScopeId])

  useEffect(() => {
    if (!chatId) {
      setScopeId(DEFAULT_SCOPE_ID)
    }
  }, [chatId])

  useEffect(() => {
    setForm({ chatId, scopeId })
  }, [chatId, scopeId, setForm])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setFlipOptionsUp(
        spaceBelow < ESTIMATED_DROPDOWN_PX && rect.top > ESTIMATED_DROPDOWN_PX,
      )
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [])

  const handleContentInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      if (target.innerHTML === '<br>') {
        target.innerHTML = ''
      }
      setText((target.textContent ?? '').trim())
    },
    [setText],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const trimmed = text.trim()
      if (trimmed && !disabled) {
        onSubmit(chatId ?? null, scopeId, trimmed)
        setText('')
        const ed = editorRef.current
        if (ed) {
          ed.textContent = ''
        }
      }
    },
    [text, disabled, onSubmit, chatId, scopeId, setText],
  )

  return {
    t,
    text,
    effectivePlaceholder,
    scopeId,
    setScopeId,
    handleSubmit,
    handleContentInput,
    disabled,
    className,
    flipOptionsUp,
    containerRef,
    editorRef,
  }
}
