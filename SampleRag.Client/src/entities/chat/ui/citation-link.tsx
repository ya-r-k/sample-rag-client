import type { Source } from '../model/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

/**
 * Builds URL for document download (citation link).
 * GET /api/files/assets/documents/{fileName}
 * Uses documentId as fileName when no explicit fileName is provided.
 */
export function getDocumentAssetUrl(fileName: string, pageNumber?: number): string {
  const base = `${API_BASE_URL}/files/assets/documents/${encodeURIComponent(fileName)}`
  if (pageNumber != null && pageNumber > 0) {
    return `${base}?page=${pageNumber}`
  }
  return base
}

type CitationLinkProps = {
  source: Source
  /** When API provides document name/fileName, use it for the URL; otherwise documentId is used */
  fileName?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Renders a link that opens the document at the cited page in a new tab.
 */
export function CitationLink({ source, fileName, className, children }: CitationLinkProps) {
  const url = getDocumentAssetUrl(fileName ?? source.documentId, source.pageNumber)
  const label = children ?? `Document, page ${source.pageNumber}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label}
    </a>
  )
}
