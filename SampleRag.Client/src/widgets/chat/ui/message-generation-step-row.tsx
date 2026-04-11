import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../../shared/lib/cn'

type MessageGenerationStepRowProps = {
  id: string
  summary: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}

const STEP_BODY_MAX_HEIGHT_CLASS = 'max-h-52'

export function MessageGenerationStepRow({
  id,
  summary,
  open,
  onToggle,
  children,
}: MessageGenerationStepRowProps) {
  return (
    <li className="border-b border-border/40 pb-1 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-1 text-left font-medium text-foreground hover:underline"
        aria-expanded={open}
        aria-controls={`generation-step-${id}`}
        id={`generation-step-trigger-${id}`}
      >
        <ChevronRight
          className={cn(
            'mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform',
            open && 'rotate-90',
          )}
          aria-hidden
        />
        <span className="whitespace-pre-wrap">{summary}</span>
      </button>
      {open && (
        <div
          id={`generation-step-${id}`}
          role="region"
          aria-labelledby={`generation-step-trigger-${id}`}
          className={cn(
            'mt-1.5 pl-5 text-[11px] leading-relaxed text-muted-foreground',
            STEP_BODY_MAX_HEIGHT_CLASS,
            'overflow-y-auto overflow-x-auto pr-1 [scrollbar-gutter:stable]',
          )}
        >
          {children}
        </div>
      )}
    </li>
  )
}
