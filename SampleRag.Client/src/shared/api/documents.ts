/**
 * Documents API — aligned with Demo RAG API spec.
 * Upload body: UploadDocumentRequestModel (name, scopeId, file with base64 content + fileName).
 * List: POST /documents/filter with GetDocumentsByModel (no GET list).
 */
import { apiPost, apiDelete } from './client'
import { authorizedFetch } from './token-manager'

export type DocumentDto = {
  id: string
  name: string
  localLink?: string
  originalLink?: string
  scopeId: string
}

/** UploadDocumentRequestModel — API expects JSON with base64 file content. */
export type UploadDocumentRequestModel = {
  name: string
  scopeId?: string
  originalLink?: string
  file: {
    content: string
    fileName: string
  }
}

export type GetDocumentsByModel = {
  lastId?: string
  batchSize?: number
}

export type ListDocumentsParams = GetDocumentsByModel

/** POST /api/documents/filter — list/filter documents. */
export async function listDocuments(
  params?: ListDocumentsParams,
): Promise<DocumentDto[]> {
  const body: GetDocumentsByModel = {
    lastId: params?.lastId,
    batchSize: params?.batchSize,
  }
  return apiPost<GetDocumentsByModel, DocumentDto[]>('/api/documents/filter', body)
}

/** POST /api/documents/filter/ids — get documents by ids. */
export async function getDocumentsByIds(ids: string[]): Promise<DocumentDto[]> {
  return apiPost<string[], DocumentDto[]>('/api/documents/filter/ids', ids)
}

/** Convert File to base64. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64 ?? '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * POST /api/documents — upload document.
 * Body: UploadDocumentRequestModel (name, scopeId, file: { content: base64, fileName }).
 * Accepts File and converts to base64, or direct { name, scopeId, file: { content, fileName } }.
 */
export async function uploadDocument(
  body:
    | { name?: string; scopeId?: string; file: File }
    | UploadDocumentRequestModel,
): Promise<DocumentDto> {
  let payload: UploadDocumentRequestModel
  if ('file' in body && body.file instanceof File) {
    const content = await fileToBase64(body.file)
    payload = {
      name: body.name ?? body.file.name,
      scopeId: body.scopeId,
      file: { content, fileName: body.file.name },
    }
  } else {
    payload = body as UploadDocumentRequestModel
  }
  return apiPost<UploadDocumentRequestModel, DocumentDto>(
    '/api/documents',
    payload,
  )
}

/** DELETE /api/documents/{id} — delete document by id. Returns 204. */
export async function deleteDocument(id: string): Promise<void> {
  await apiDelete(`/api/documents/${encodeURIComponent(id)}`)
}

/** GET /api/files/... — download PDF and return as Blob for client-side viewer. */
export async function getDocumentAssetBlob(localLink: string): Promise<Blob> {
  const normalizedPath = localLink.replace(/\\/g, '/').replace(/^\/+/, '')
  const response = await authorizedFetch(`/api/files/${normalizedPath}`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.blob()
}
