/**
 * Knowledge Scopes API — aligned with Demo RAG API spec.
 * Base path: /api. List uses POST .../filter with cursor-style body (no GET list).
 */
import { apiPost, apiDelete } from './client'

export type ScopeDto = {
  id: string
  name: string
  documentsCount: number
  indexPercentage: number
}

/** CreateScopeRequest: single or array; usersIds optional. */
export type CreateScopeRequest = {
  name: string
  usersIds?: string[]
}

/** GetBatchByModel for POST .../filter */
export type GetBatchByModel = {
  lastId?: string
  batchSize?: number
}

/** AddScopeUserRequest — spec uses "usersId" (typo); API may accept array of user ids. */
export type AddScopeUserRequest = {
  usersId?: string[]
}

export type ListScopesParams = GetBatchByModel

/** POST /api/knowledgescopes/filter — list scopes (caller-scoped when user present). */
export async function getScopes(params?: ListScopesParams): Promise<ScopeDto[]> {
  const body = {
    lastId: params?.lastId,
    batchSize: params?.batchSize,
  }
  return apiPost<typeof body, ScopeDto[]>('/api/knowledgescopes/filter', body)
}

/** POST /api/knowledgescopes — create scope(s). Body: single or array. Returns 201 + created scope(s). */
export async function createScope(body: CreateScopeRequest[]): Promise<ScopeDto> {
  const result = await apiPost<CreateScopeRequest[], ScopeDto[] | ScopeDto[]>(
    '/api/knowledgescopes',
    body,
  )

  return Array.isArray(result) ? result[0] : result
}

/** DELETE /api/knowledgescopes/{id} — delete scope. Returns 204. */
export async function deleteScope(scopeId: string): Promise<void> {
  await apiDelete(`/api/knowledgescopes/${encodeURIComponent(scopeId)}`)
}

/** POST /api/knowledgescopes/{id}/users — add user(s) to scope. Returns 204. */
export async function addScopeUsers(
  scopeId: string,
  body: AddScopeUserRequest,
): Promise<void> {
  await apiPost<AddScopeUserRequest, unknown>(
    `/api/knowledgescopes/${encodeURIComponent(scopeId)}/users`,
    body,
  )
}

/** DELETE /api/knowledgescopes/{id}/users/{userId} — remove user from scope. Returns 204. */
export async function removeScopeUser(
  scopeId: string,
  userId: string,
): Promise<void> {
  await apiDelete(
    `/api/knowledgescopes/${encodeURIComponent(scopeId)}/users/${encodeURIComponent(userId)}`,
  )
}
