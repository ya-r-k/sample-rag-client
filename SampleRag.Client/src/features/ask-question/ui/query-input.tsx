import { useCallback, useEffect } from 'react'
import { Button } from '../../../shared/ui/button'
import { cn } from '../../../shared/lib/cn'
import { ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMessageSubmissionStore } from '../../../shared/store/message-submission-store'
import { ScopeSelector } from './scope-selector'

type QueryInputProps = {
  onSubmit: (text: string, scopeId: string | null) => void
  chatId?: string | null
  scopeId: string | null
  onScopeIdChange: (scopeId: string | null) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function QueryInput({
  onSubmit,
  chatId = null,
  scopeId,
  onScopeIdChange,
  disabled = false,
  placeholder,
  className,
}: QueryInputProps) {
  const { t } = useTranslation()
  const text = useMessageSubmissionStore((s) => s.text)
  const setText = useMessageSubmissionStore((s) => s.setText)
  const setForm = useMessageSubmissionStore((s) => s.setForm)
  const effectivePlaceholder = placeholder ?? t('chat.placeholderAsk')

  useEffect(() => {
    setForm({ chatId, scopeId })
  }, [chatId, scopeId, setForm])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = text.trim()
      if (trimmed && !disabled) {
        onSubmit(trimmed, scopeId)
        setText('')
      }
    },
    [text, disabled, onSubmit, scopeId, setText],
  )

  return (
    <div className={cn("max-w-3xl w-full bg-white dark:bg-gray-900 outline-none flex items-center border rounded-2xl transition-all duration-75 border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-xl px-4 py-3 gap-2", className)}>
      <form onSubmit={handleSubmit} className='w-full h-full grid grid-cols-[1fr_1fr_1fr] grid-rows-[1fr_auto] gap-y-2'>
        <div
          id="user-query-input"
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={(e) => {
            if (e.currentTarget.innerHTML === '<br>') {
              e.currentTarget.innerHTML = ''
            }
            
            setText(e.currentTarget.textContent.trim() || '')
          }}
          role="textbox"
          aria-placeholder={effectivePlaceholder}
          aria-label={t('queryInput.ariaLabel')}
          style={{ userSelect: 'text', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          className="col-start-1 col-end-4 row-start-1 row-end-2 my-3
            w-full h-full 
            max-h-[20vh] overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-sky-700
            empty:before:content-[attr(aria-placeholder)] empty:before:text-gray-500 dark:empty:before:text-gray-400 empty:before:pointer-events-none empty:before:select-none
            placeholder-quieter placeholder:select-none
            bg-transparent text-gray-900
            dark:text-white font-sans text-sm 
            resize-none outline-none selection:bg-blue-200 
            dark:selection:bg-blue-800/20 
            p-0 min-h-[2.5rem]"
        />
        <div className='col-start-1 col-end-3 row-start-2 row-end-3 w-full h-full flex justify-start pr-2'>
          <ScopeSelector
            value={scopeId}
            onChange={onScopeIdChange}
            disabled={disabled}
            className="w-full max-w-56"
            placeholder={t('documentsPage.selectScope')}
          />
        </div>
        <div className='col-start-3 col-end-4 row-start-2 row-end-3 w-full h-full flex justify-end'>
          <Button 
            className='transition-all duration-200 rounded-full aspect-square flex items-center justify-center h-7 w-7 shrink-0 bg-white text-gray-900' 
            type="submit" 
            disabled={!text.trim() || !scopeId}
            aria-label={t('queryInput.sendAriaLabel')}>
            <ArrowUp className='w-3 h-3' />
          </Button>
        </div>
      </form>
    </div>
  )
}
