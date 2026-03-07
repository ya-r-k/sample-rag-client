/**
 * Scope (knowledge group) — collection of documents users can query.
 * API path: GET/POST /api/groups
 */
export type Scope = {
  id: string
  name: string
}

/**
 * Source (citation) — reference to a document and page from RAG response.
 * Used for citation links in answers.
 */
export type Source = {
  documentId: string
  pageNumber: number
}
