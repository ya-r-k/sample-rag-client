/**
 * Chats API — list and get chat by id (aligned with openapi.yaml).
 * Shared layer uses DTOs; map to entity types in widgets/pages.
 */
import { apiGet } from './client'

export type ChatDto = {
  id: string
  title: string
  scopeId: string
  ownerIds: string[]
}

export type MessageDto = {
  id?: string
  chatId?: string
  text: string
  createdAt?: string
}

export type ChatWithMessagesDto = ChatDto & {
  messages?: MessageDto[]
}

export type ListChatsParams = {
  batchSize?: number
  lastUsedIndex?: number
}

/**
 * GET /api/chats — list chats where caller is in ownerIds.
 */
export async function getChats(
  params?: ListChatsParams,
): Promise<ChatDto[]> {
  const search = new URLSearchParams()
  if (params?.batchSize != null) search.set('batchSize', String(params.batchSize))
  if (params?.lastUsedIndex != null) search.set('lastUsedIndex', String(params.lastUsedIndex))
  const query = search.toString()
  const path = query ? `/chats?${query}` : '/chats'
  return apiGet<ChatDto[]>(path)
}

/**
 * GET /api/chats/{id} — get chat by id. Response may include optional messages array.
 */
export async function getChatById(id: string): Promise<ChatWithMessagesDto> {
  return apiGet<ChatWithMessagesDto>(`/chats/${encodeURIComponent(id)}`)
}
