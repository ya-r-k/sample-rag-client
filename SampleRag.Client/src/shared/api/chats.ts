/**
 * Chats API — aligned with Demo RAG API spec.
 * List: POST /api/chats/filter (no GET list). No GET /api/chats/{id}; get chat from list or sendMessage response.
 */
import { apiPost, apiDelete } from './client'

export type ChatDto = {
  id: string
  name: string
  scopeId: string
  ownerIds: string[]
}

export type MessageDto = {
  id?: string
  chatId?: string
  text: string
  createdAt?: string
}

/** GetChatsByModel — extends GetBatchByModel with optional scopeId. */
export type GetChatsByModel = {
  lastId?: string
  batchSize?: number
  scopeId?: string
}

export type ListChatsParams = GetChatsByModel

/** CreateChatRequest — if ownerIds omitted, caller is used as sole owner. */
export type CreateChatRequest = {
  name: string
  scopeId: string
  ownerIds?: string[]
}

/** AddChatOwnerRequest — single userId per request. */
export type AddChatOwnerRequest = {
  userId: string
}

/** POST /api/chats/filter — list chats. Body: GetChatsByModel. */
export async function getChats(params?: ListChatsParams): Promise<ChatDto[]> {
  const body = {
    lastId: params?.lastId,
    batchSize: params?.batchSize,
    scopeId: params?.scopeId,
  }
  return apiPost<typeof body, ChatDto[]>('/api/chats/filter', body)
}

/** POST /api/chats — create chat. Returns 201 + chat. */
export async function createChat(body: CreateChatRequest): Promise<ChatDto> {
  return apiPost<CreateChatRequest, ChatDto>('/api/chats', body)
}

/**
 * POST /api/chats/{id}/owners — add owner. Body: AddChatOwnerRequest (userId).
 * For multiple users, call once per user.
 */
export async function addChatOwners(
  id: string,
  body: AddChatOwnerRequest,
): Promise<void> {
  await apiPost<AddChatOwnerRequest, unknown>(
    `/api/chats/${encodeURIComponent(id)}/owners`,
    body,
  )
}

/** DELETE /api/chats/{id} — delete chat. Returns 204. */
export async function deleteChat(id: string): Promise<void> {
  await apiDelete(`/api/chats/${encodeURIComponent(id)}`)
}
