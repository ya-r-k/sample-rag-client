import type { TFunction } from 'i18next'
import { AiTool } from '../../../shared/api/messages'
import type { ToolStepItem } from '../../../shared/store/message-generation-steps-store'
import {
  pickAutoScope,
  pickQuery,
  pickScope,
  remainingInternalDocArgs,
} from '../lib/generation-step-arg-utils'

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function toolName(tool: AiTool, t: TFunction): string {
  switch (tool) {
    case AiTool.InternalDocumentData:
      return t('generationSteps.searchDocs')
    case AiTool.CurrentTime:
      return t('generationSteps.currentTime')
    default:
      return t('generationSteps.unknownTool')
  }
}

type FriendlyValueProps = {
  value: unknown
  t: TFunction
  depth?: number
}

const MAX_DEPTH = 4
const MAX_ARRAY_ITEMS = 25

function FriendlyValue({ value, t, depth = 0 }: FriendlyValueProps) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">{t('generationSteps.emptyValue')}</span>
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return <span className="text-muted-foreground">{t('generationSteps.emptyValue')}</span>
    }
    const asDate = Date.parse(trimmed)
    if (!Number.isNaN(asDate) && trimmed.length >= 8 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      try {
        return (
          <time dateTime={trimmed} className="text-foreground/90">
            {new Date(trimmed).toLocaleString()}
          </time>
        )
      } catch {
        /* fall through */
      }
    }
    return <p className="whitespace-pre-wrap text-foreground/90">{value}</p>
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-foreground/90">{String(value)}</span>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">{t('generationSteps.emptyList')}</span>
    }
    const slice = value.slice(0, MAX_ARRAY_ITEMS)
    return (
      <ul className="list-inside list-disc space-y-2 text-foreground/90">
        {slice.map((item, i) => (
          <li key={i}>
            {depth >= MAX_DEPTH ? (
              <span className="text-muted-foreground">{t('generationSteps.truncated')}</span>
            ) : (
              <FriendlyValue value={item} t={t} depth={depth + 1} />
            )}
          </li>
        ))}
        {value.length > MAX_ARRAY_ITEMS && (
          <li className="list-none text-muted-foreground">
            {t('generationSteps.andMoreItems', { count: value.length - MAX_ARRAY_ITEMS })}
          </li>
        )}
      </ul>
    )
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(
      ([, v]) => v !== undefined && v !== null && v !== '',
    )
    if (entries.length === 0) {
      return <span className="text-muted-foreground">{t('generationSteps.emptyValue')}</span>
    }
    const looksLikeHit =
      ('documentId' in value || 'documentID' in value) &&
      ('pageNumber' in value || 'page' in value || 'snippet' in value || 'text' in value)

    if (looksLikeHit && depth === 0) {
      const docId = (value.documentId ?? value.documentID) as string | undefined
      const page = (value.pageNumber ?? value.page) as number | string | undefined
      const snippet = (value.snippet ?? value.text ?? value.content) as string | undefined
      return (
        <div className="space-y-1 rounded border border-border/50 bg-background/60 px-2 py-1.5">
          {(docId || page !== undefined) && (
            <div className="font-medium text-foreground/90">
              {docId && <span className="mr-2">{docId}</span>}
              {page !== undefined && (
                <span className="text-muted-foreground">
                  {t('generationSteps.resultPage', { page: String(page) })}
                </span>
              )}
            </div>
          )}
          {snippet && (
            <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
              {snippet}
            </p>
          )}
        </div>
      )
    }

    return (
      <dl className="space-y-1.5">
        {entries.map(([k, v]) => (
          <div key={k}>
            <dt className="font-medium text-foreground/80">{humanizeKey(k)}</dt>
            <dd className="mt-0.5 pl-0">
              {depth >= MAX_DEPTH ? (
                <span className="text-muted-foreground">{t('generationSteps.truncated')}</span>
              ) : (
                <FriendlyValue value={v} t={t} depth={depth + 1} />
              )}
            </dd>
          </div>
        ))}
      </dl>
    )
  }
  return <span className="text-foreground/90">{String(value)}</span>
}

type ToolStepPresentationProps = {
  item: ToolStepItem
  t: TFunction
}

export function ToolStepPresentation({ item, t }: ToolStepPresentationProps) {
  const args = item.arguments
  const hasArgs = args && Object.keys(args).length > 0
  const extraInternalArgs =
    item.tool === AiTool.InternalDocumentData ? remainingInternalDocArgs(args) : undefined

  return (
    <div className="space-y-3">
      {item.tool === AiTool.InternalDocumentData && hasArgs && (
        <div>
          <div className="font-medium text-foreground/90">{t('generationSteps.searchRequest')}</div>
          <dl className="mt-1 space-y-1">
            {pickQuery(args) && (
              <div>
                <dt className="inline font-medium text-foreground/80">
                  {t('generationSteps.searchQuery')}
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap pl-0 text-foreground/90">
                  {pickQuery(args)}
                </dd>
              </div>
            )}
            {pickScope(args) && (
              <div>
                <dt className="inline font-medium text-foreground/80">
                  {t('generationSteps.knowledgeScope')}
                </dt>
                <dd className="inline pl-1">{pickScope(args)}</dd>
              </div>
            )}
            {pickAutoScope(args) !== undefined && (
              <div>
                <dt className="inline font-medium text-foreground/80">
                  {t('generationSteps.autoScope')}
                </dt>
                <dd className="inline pl-1">
                  {pickAutoScope(args) ? t('generationSteps.yes') : t('generationSteps.no')}
                </dd>
              </div>
            )}
          </dl>
          {extraInternalArgs && (
            <div className="mt-2">
              <div className="font-medium text-foreground/90">
                {t('generationSteps.additionalParameters')}
              </div>
              <div className="mt-1">
                <FriendlyValue value={extraInternalArgs} t={t} />
              </div>
            </div>
          )}
        </div>
      )}

      {item.tool === AiTool.CurrentTime && hasArgs && (
        <div>
          <div className="font-medium text-foreground/90">{t('generationSteps.callContext')}</div>
          <div className="mt-1">
            <FriendlyValue value={args} t={t} />
          </div>
        </div>
      )}

      {item.tool !== AiTool.InternalDocumentData &&
        item.tool !== AiTool.CurrentTime &&
        hasArgs && (
          <div>
            <div className="font-medium text-foreground/90">
              {t('generationSteps.callParameters', { tool: toolName(item.tool, t) })}
            </div>
            <div className="mt-1">
              <FriendlyValue value={args} t={t} />
            </div>
          </div>
        )}

      {item.result !== undefined && (
        <div>
          <div className="font-medium text-foreground/90">{t('generationSteps.toolResult')}</div>
          <div className="mt-1">
            {item.tool === AiTool.CurrentTime ? (
              <FriendlyValue value={item.result} t={t} />
            ) : item.tool === AiTool.InternalDocumentData ? (
              <div className="space-y-2">
                <div className="text-[11px] text-muted-foreground">
                  {t('generationSteps.searchOutcomeIntro')}
                </div>
                <FriendlyValue value={item.result} t={t} />
              </div>
            ) : (
              <FriendlyValue value={item.result} t={t} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
