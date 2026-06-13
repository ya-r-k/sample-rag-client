import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMessageSubmissionStore } from '../../../shared/store/message-submission-store'
import { useChatsStore } from '../../../shared/store/chats-store'
import { useMessageGenerationStepsStore } from '../../../shared/store/message-generation-steps-store'
import { QueryInputProps } from './query-input.props'

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
  const activeTurnId = useMessageGenerationStepsStore((s) => s.activeTurnId)
  const chatScopeId = useMemo(
    () => (chatId ? chats.find((c) => c.id === chatId)?.scopeId ?? null : null),
    [chats, chatId],
  )

  const [scopeId, setScopeId] = useState<string | null>(null)
  const [isScopeInvalid, setIsScopeInvalid] = useState(false)
  const [flipOptionsUp, setFlipOptionsUp] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const effectivePlaceholder = placeholder ?? t('chat.placeholderAsk')

  const isGenerating = activeTurnId !== null

  useEffect(() => {
    if (chatScopeId) {
      setScopeId(chatScopeId)
    }
  }, [chatScopeId])


  useEffect(() => {
    if (scopeId) {
      setIsScopeInvalid(false)
    }
  }, [scopeId])

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

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault()
      const plain = e.clipboardData.getData('text/plain')
      const editor = editorRef.current
      if (!editor || plain === '') {
        return
      }
      const selection = window.getSelection()
      if (!selection?.rangeCount) {
        return
      }
      const range = selection.getRangeAt(0)
      if (!editor.contains(range.commonAncestorContainer)) {
        return
      }
      range.deleteContents()
      const node = document.createTextNode(plain)
      range.insertNode(node)
      range.setStartAfter(node)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      if (editor.innerHTML === '<br>') {
        editor.innerHTML = ''
      }
      setText((editor.textContent ?? '').trim())
    },
    [setText],
  )

  const handleSubmit = useCallback(
    (e: React.SubmitEvent) => {
      e.preventDefault()
      const trimmed = text.trim()
      if (!trimmed || disabled || isGenerating) {
        return
      }
      if (!scopeId) {
        setIsScopeInvalid(true)
        return
      }
      onSubmit(chatId ?? null, scopeId, trimmed)
      setText('')
      const ed = editorRef.current
      if (ed) {
        ed.textContent = ''
      }
    },
    [text, disabled, isGenerating, onSubmit, chatId, scopeId, setText],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          // Allow default behavior for Shift+Enter (line break)
          return
        } else {
          // Prevent default behavior and submit form on Enter
          e.preventDefault()
          const syntheticEvent = {
            preventDefault: () => {},
          } as React.SubmitEvent
          handleSubmit(syntheticEvent)
        }
      }
    },
    [handleSubmit],
  )

  return {
    t,
    text,
    effectivePlaceholder,
    scopeId,
    setScopeId,
    isScopeInvalid,
    handleSubmit,
    handleContentInput,
    handlePaste,
    handleKeyDown,
    disabled,
    isGenerating,
    className,
    flipOptionsUp,
    containerRef,
    editorRef,
  }
}
