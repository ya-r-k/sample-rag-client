/**
 * Message — single entry in a chat (user question or system response).
 * Created via POST /api/messages.
 */
export type Message = {
  id?: string
  chatId?: string
  text: string
  createdAt?: string
}

/**
 * Source (citation) — reference to a document and page from RAG response.
 */
export type Source = {
  documentId: string
  pageNumber: number
}

/**
 * Chat — conversation with a scope and owners.
 * API: POST /api/chats, POST /api/chats/filter (no GET by id); DTO uses "name", mapped to title in UI.
 */
export type Chat = {
  id: string
  title: string
  scopeId: string
  ownerIds: string[]
}
