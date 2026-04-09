/**
 * Messages API — aligned with Demo RAG API spec.
 * SendMessageRequest: { chatId, text }. Use chatId "00000000-0000-0000-0000-000000000000" for "create chat and send".
 */
import { authorizedFetch } from './token-manager'
import { apiPost } from './client'

export type MessageDto = {
  id?: string
  chatId?: string
  text: string
  createdAt?: string
  aiGenerated?: boolean
  sourceReferences?: SourceDto[]
}

export type ChatDto = {
  id: string
  name: string
  scopeId: string
  ownerIds: string[]
}

export type SourceDto = {
  documentId: string
  pageNumber: number
}

/** SendMessageRequest — empty guid for new chat (service may create chat and stream first). */
export type SendMessageRequestBody = {
  chatId: string | undefined,
  scopeId: string | undefined,
  text: string
}

export type SendMessageResponse = {
  message: MessageDto
  chat?: ChatDto
  answer: string
  sources: SourceDto[]
}

/** Optional payload for hidden stream UI (reasoning, retrieval, tools). Not merged into MessageDto. */
export type StreamArtifactEventItem = {
  type: 'reasoning' | 'retrieval' | 'tool'
  text?: string
  payload?: unknown
  at?: number
}

export type SendMessageStreamEvent = {
  textDelta?: string
  message?: MessageDto
  chat?: ChatDto
  sources?: SourceDto[]
  /** Incremental reasoning text (server-specific); not shown as a chat message. */
  reasoningDelta?: string
  retrievalDelta?: string
  /** One structured artifact row from the server. */
  streamArtifact?: StreamArtifactEventItem
  /** Batch artifact rows. */
  streamArtifacts?: StreamArtifactEventItem[]
}

export type SendMessageOptions = {
  onEvent?: (event: SendMessageStreamEvent) => void
}

/** GetMessagesByModel for POST /messages/filter. */
export type GetMessagesByModel = {
  lastId?: string
  batchSize?: number
  chatId?: string
}

/**
 * POST /api/messages — send message. Returns stream (SSE) or 201 JSON.
 * When chatId is empty guid, service may create a new chat and stream it first.
 */
export async function sendMessage(
  body: SendMessageRequestBody,
  options?: SendMessageOptions,
): Promise<SendMessageResponse> {
  console.log('sendMessage', body)

  const response = await authorizedFetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const contentType = (response.headers.get('content-type') ?? '').toLowerCase()

  if (contentType.includes('text/event-stream')) {
    return parseSSEResponse(response, options)
  }

  return (await response.json()) as SendMessageResponse
}

/**
 * POST /api/messages/filter — list/filter messages.
 */
export async function getMessagesFilter(
  body: GetMessagesByModel,
): Promise<MessageDto[]> {
  return apiPost<GetMessagesByModel, MessageDto[]>('/api/messages/filter', body)
}

/**
 * Parses SSE stream into a single SendMessageResponse.
 */
async function parseSSEResponse(
  response: Response,
  options?: SendMessageOptions,
): Promise<SendMessageResponse> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''
  let message: SendMessageResponse['message'] = { text: '' }
  let chat: SendMessageResponse['chat']
  let sources: SendMessageResponse['sources'] = []

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]' || data === '') continue
          try {
            const parsed = JSON.parse(data) as Record<string, unknown>
            if (typeof parsed.text === 'string') {
              answer += parsed.text
              options?.onEvent?.({ textDelta: parsed.text })
            }
            if (parsed.message) {
              message = parsed.message as SendMessageResponse['message']
              options?.onEvent?.({ message })
            }
            if (parsed.chat) {
              chat = parsed.chat as SendMessageResponse['chat']
              options?.onEvent?.({ chat })
            }
            if (Array.isArray(parsed.sources)) {
              sources = parsed.sources as SendMessageResponse['sources']
              options?.onEvent?.({ sources })
            }
            if (typeof parsed.reasoningDelta === 'string') {
              options?.onEvent?.({ reasoningDelta: parsed.reasoningDelta })
            }
            if (typeof parsed.retrievalDelta === 'string') {
              options?.onEvent?.({ retrievalDelta: parsed.retrievalDelta })
            }
            if (
              parsed.streamArtifact &&
              typeof parsed.streamArtifact === 'object'
            ) {
              options?.onEvent?.({
                streamArtifact: parsed.streamArtifact as SendMessageStreamEvent['streamArtifact'],
              })
            }
            if (Array.isArray(parsed.artifacts)) {
              options?.onEvent?.({
                streamArtifacts: parsed.artifacts as NonNullable<
                  SendMessageStreamEvent['streamArtifacts']
                >,
              })
            }
            if (
              parsed.reasoning &&
              typeof parsed.reasoning === 'string' &&
              !parsed.reasoningDelta
            ) {
              options?.onEvent?.({ reasoningDelta: parsed.reasoning })
            }
          } catch {
            // ignore non-JSON or partial lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return {
    message: message.id ? message : { ...message, text: message.text || answer },
    chat,
    answer: answer || message.text,
    sources,
  }
}
