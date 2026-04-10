import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { AiTool } from '../../../shared/api/messages'
import {
  type MessageGenerationStepItem,
  useMessageGenerationStepsStore,
} from '../../../shared/store/message-generation-steps-store'
import { cn } from '../../../shared/lib/cn'

/** Stable fallback so Zustand selectors do not return a new `[]` every run (infinite re-renders). */
const EMPTY_STEPS: MessageGenerationStepItem[] = []

type MessageGenerationStepsProps = {
  messageId: string | undefined
  steps: MessageGenerationStepItem[]
  isStreaming: boolean
  streamPhase: 'pre_answer' | 'final_answer' | undefined
  trackKey: string
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? ''
  } catch {
    return String(value)
  }
}

function pickQuery(args: Record<string, unknown> | undefined): string | undefined {
  if (!args) return undefined
  const q = args.query ?? args.q ?? args.searchQuery ?? args.text
  return typeof q === 'string' ? q : undefined
}

function pickScope(args: Record<string, unknown> | undefined): string | undefined {
  if (!args) return undefined
  const s = args.scopeId ?? args.scope ?? args.knowledgeScopeId
  if (typeof s === 'string') return s
  return undefined
}

function pickAutoScope(args: Record<string, unknown> | undefined): boolean | undefined {
  if (!args) return undefined
  const v = args.autoScope ?? args.automaticScope ?? args.useAutomaticScope
  return typeof v === 'boolean' ? v : undefined
}

export function MessageGenerationSteps({
  messageId,
  steps,
  isStreaming,
  streamPhase,
  trackKey,
}: MessageGenerationStepsProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const phase = streamPhase ?? 'pre_answer'

  useEffect(() => {
    if (!isStreaming) {
      setExpanded(new Set())
    }
  }, [isStreaming])

  useEffect(() => {
    if (!isStreaming) {
      return
    }
    if (phase === 'final_answer') {
      setExpanded(new Set())
      return
    }
    const last = steps[steps.length - 1]
    if (last) {
      setExpanded(new Set([last.id]))
    } else {
      setExpanded(new Set())
    }
  }, [isStreaming, phase, steps])

  const toggle = useCallback(
    (id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    },
    [],
  )

  const summaryFor = useCallback(
    (item: MessageGenerationStepItem): string => {
      if (item.kind === 'reasoning') {
        return t('generationSteps.reasoningSummary')
      }
      switch (item.tool) {
        case AiTool.InternalDocumentData: {
          const q = pickQuery(item.arguments)
          return q
            ? t('generationSteps.searchDocsWithQuery', { query: q })
            : t('generationSteps.searchDocs')
        }
        case AiTool.CurrentTime:
          return t('generationSteps.currentTime')
        default:
          return t('generationSteps.unknownTool')
      }
    },
    [t],
  )

  if (steps.length === 0) {
    return null
  }

  return (
    <div
      className="w-full max-w-[85%] rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
      data-message-id={messageId}
      data-track={trackKey}
    >
      <ul className="flex flex-col gap-1">
        {steps.map((item) => {
          const open = expanded.has(item.id)
          return (
            <li key={item.id} className="border-b border-border/40 pb-1 last:border-0 last:pb-0">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="flex w-full items-start gap-1 text-left font-medium text-foreground hover:underline"
                aria-expanded={open}
              >
                <ChevronRight
                  className={cn(
                    'mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform',
                    open && 'rotate-90',
                  )}
                  aria-hidden
                />
                <span className="whitespace-pre-wrap">{summaryFor(item)}</span>
              </button>
              {open && (
                <div className="mt-1.5 pl-5 text-[11px] leading-relaxed text-muted-foreground">
                  {item.kind === 'reasoning' ? (
                    <pre className="whitespace-pre-wrap font-sans">{item.text}</pre>
                  ) : (
                    <Fragment>
                      {item.arguments && Object.keys(item.arguments).length > 0 && (
                        <div className="mb-2">
                          <div className="font-medium text-foreground/90">
                            {t('generationSteps.callDetails')}
                          </div>
                          {item.tool === AiTool.InternalDocumentData && (
                            <dl className="mt-1 space-y-1">
                              {pickScope(item.arguments) && (
                                <div>
                                  <dt className="inline font-medium text-foreground/80">
                                    {t('generationSteps.knowledgeScope')}
                                  </dt>
                                  <dd className="inline pl-1">{pickScope(item.arguments)}</dd>
                                </div>
                              )}
                              {pickAutoScope(item.arguments) !== undefined && (
                                <div>
                                  <dt className="inline font-medium text-foreground/80">
                                    {t('generationSteps.autoScope')}
                                  </dt>
                                  <dd className="inline pl-1">
                                    {pickAutoScope(item.arguments)
                                      ? t('generationSteps.yes')
                                      : t('generationSteps.no')}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          )}
                          <pre className="mt-1 max-h-40 overflow-auto rounded bg-background/80 p-2 font-mono text-[10px]">
                            {formatJson(item.arguments)}
                          </pre>
                        </div>
                      )}
                      {item.result !== undefined && (
                        <div>
                          <div className="font-medium text-foreground/90">
                            {t('generationSteps.toolResult')}
                          </div>
                          <pre className="mt-1 max-h-48 overflow-auto rounded bg-background/80 p-2 font-mono text-[10px]">
                            {formatJson(item.result)}
                          </pre>
                        </div>
                      )}
                    </Fragment>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function useStepsForAssistantMessage(
  messageId: string | undefined,
  messageIndex: number,
  messages: { aiGenerated: boolean; id?: string }[],
  isSubmitting: boolean,
): {
  steps: MessageGenerationStepItem[]
  isStreaming: boolean
  streamPhase: 'pre_answer' | 'final_answer' | undefined
  trackKey: string
} {
  const activeTurnId = useMessageGenerationStepsStore((s) => s.activeTurnId)
  const pendingSteps = useMessageGenerationStepsStore((s) => {
    const id = s.activeTurnId
    if (!id) return EMPTY_STEPS
    return s.pendingByTurnId[id] ?? EMPTY_STEPS
  })
  const streamPhase = useMessageGenerationStepsStore((s) => {
    const id = s.activeTurnId
    if (!id) return undefined
    return s.streamPhaseByTurnId[id]
  })
  const storedForId = useMessageGenerationStepsStore((s) => {
    if (!messageId) return EMPTY_STEPS
    return s.byMessageId[messageId] ?? EMPTY_STEPS
  })

  return useMemo(() => {
    if (messageId && storedForId.length > 0) {
      return {
        steps: storedForId,
        isStreaming: false,
        streamPhase: undefined,
        trackKey: messageId,
      }
    }

    const isPlaceholderAssistant =
      isSubmitting &&
      activeTurnId &&
      (() => {
        const lastNoIdAi = [...messages]
          .map((m, i) => ({ m, i }))
          .filter(({ m }) => m.aiGenerated && !m.id)
          .pop()
        return lastNoIdAi?.i === messageIndex
      })()

    if (isPlaceholderAssistant && pendingSteps.length > 0) {
      return {
        steps: pendingSteps,
        isStreaming: true,
        streamPhase,
        trackKey: activeTurnId ?? `stream-${messageIndex}`,
      }
    }

    return {
      steps: EMPTY_STEPS,
      isStreaming: Boolean(isPlaceholderAssistant),
      streamPhase,
      trackKey: messageId ?? activeTurnId ?? `row-${messageIndex}`,
    }
  }, [
    messageId,
    messageIndex,
    messages,
    isSubmitting,
    activeTurnId,
    pendingSteps,
    streamPhase,
    storedForId,
  ])
}
