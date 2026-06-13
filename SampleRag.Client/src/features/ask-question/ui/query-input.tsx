import { Button } from '../../../shared/ui/button'
import { cn } from '../../../shared/lib/cn'
import { ArrowUp } from 'lucide-react'
import { ScopeSelector } from './scope-selector'
import { QueryInputProps } from './query-input.props'
import { useQueryInput } from './query-input.hook'

export function QueryInput(props: QueryInputProps) {
  const {
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
  } = useQueryInput(props)

  return (
    <div
      ref={containerRef}
      className={cn(
        'max-w-3xl w-full bg-white dark:bg-gray-900 outline-none flex items-center border rounded-2xl transition-all duration-75 border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-xl px-4 py-3 gap-2',
        className,
      )}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full h-full grid grid-cols-[1fr_1fr_1fr] grid-rows-[1fr_auto] gap-y-2"
      >
        <div
          ref={editorRef}
          id="user-query-input"
          contentEditable={!disabled && !isGenerating}
          suppressContentEditableWarning={true}
          onInput={handleContentInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          role="textbox"
          aria-placeholder={effectivePlaceholder}
          aria-label={t('queryInput.ariaLabel')}
          style={{ userSelect: 'text', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          className={cn(
            "col-start-1 col-end-4 row-start-1 row-end-2 my-3",
            "w-full h-full",
            "max-h-[20vh] overflow-y-auto h-full scrollbar-thin scrollbar-track-muted scrollbar-thumb-sky-700",
            "empty:before:content-[attr(aria-placeholder)] empty:before:text-gray-500 dark:empty:before:text-gray-400 empty:before:pointer-events-none empty:before:select-none",
            "placeholder-quieter placeholder:select-none",
            "bg-transparent text-gray-900",
            "dark:text-white font-sans text-sm",
            "resize-none outline-none selection:bg-blue-200",
            "dark:selection:bg-blue-800/20",
            "p-0 min-h-[2.5rem]",
            (disabled || isGenerating) && "opacity-50 cursor-not-allowed"
          )}
        />
        <div
          className={cn(
            'col-start-1 col-end-3 row-start-2 row-end-3 w-full h-full flex justify-start pr-2 rounded-md transition-colors',
            isScopeInvalid && 'ring-1 ring-red-500',
          )}
        >
          <ScopeSelector
            value={scopeId}
            onChange={setScopeId}
            disabled={disabled}
            className="w-full max-w-56"
            placeholder={t('documentsPage.selectScope')}
            flipOptionsUp={flipOptionsUp}
          />
        </div>
        <div className="col-start-3 col-end-4 row-start-2 row-end-3 w-full h-full flex justify-end">
          <Button
            className="transition-all duration-200 rounded-full aspect-square flex items-center justify-center h-7 w-7 shrink-0 bg-white text-gray-900"
            type="submit"
            disabled={!text.trim() || disabled || isGenerating}
            aria-label={t('queryInput.sendAriaLabel')}
          >
            <ArrowUp className="w-3 h-3" />
          </Button>
        </div>
      </form>
    </div>
  )
}
