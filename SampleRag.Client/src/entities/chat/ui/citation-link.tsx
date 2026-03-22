import type { Source } from '../model/types'
import { i18n } from '../../../shared/lib/i18n'
import type { DocumentDto } from '../../../shared/api/documents'

/**
 * Builds URL for document download (citation link).
 * GET /api/files/assets/documents/{fileName}
 * Uses documentId as fileName when no explicit fileName is provided.
 */
export function getDocumentAssetUrl(localLink: string, name: string, pageNumber?: number): string {
  const base = `/documents/view?path=${encodeURIComponent(localLink)}&name=${encodeURIComponent(name)}`
  if (pageNumber != null && pageNumber > 0) {
    return `${base}&page=${pageNumber}`
  }
  return base
}

type CitationLinkProps = {
  source: Source
  /** When API provides document name/fileName, use it for the URL; otherwise documentId is used */
  fileName?: string
  /** Loaded document metadata — used for label and better file path when available */
  document?: Pick<DocumentDto, 'id' | 'name' | 'localLink'>
  className?: string
  children?: React.ReactNode
}

export function CitationLink({ source, document: doc, className, children }: CitationLinkProps) {
  const url = getDocumentAssetUrl(doc?.localLink ?? '', doc?.name ?? '', source.pageNumber)                          

  const label =
    children ??
    (doc?.name
      ? i18n.t('chat.sourceWithDocName', { name: doc.name, page: source.pageNumber })
      : i18n.t('chat.sourcePage', { page: source.pageNumber }))

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {label}
    </a>
  )
}
