/**
 * DTOs for POST /api/messages (aligned with openapi.yaml).
 * Shared layer does not import entities; use these types or map in features/pages.
 */
import { authorizedFetch } from './token-manager'

export type MessageDto = {
  id?: string
  chatId?: string
  text: string
  createdAt?: string
}

export type ChatDto = {
  id: string
  title: string
  scopeId: string
  ownerIds: string[]
}

export type SourceDto = {
  documentId: string
  pageNumber: number
}

export type SendMessageRequestBody =
  | { scopeId: string; text: string }
  | { chatId: string; text: string }

export type SendMessageResponse = {
  message: MessageDto
  chat?: ChatDto
  answer: string
  sources: SourceDto[]
}

/**
 * Sends a message (new chat with scopeId+text or existing chat with chatId+text).
 * Handles both 201 JSON and SSE stream responses; returns normalized result.
 */
export async function sendMessage(
  body: SendMessageRequestBody,
): Promise<SendMessageResponse> {
  const response = await authorizedFetch('/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('text/event-stream')) {
    return parseSSEResponse(response)
  }

  return (await response.json()) as SendMessageResponse
}

/**
 * Parses SSE stream into a single SendMessageResponse.
 * Accumulates "text" events into answer; expects final "message" or JSON event with message, chat?, sources.
 */
async function parseSSEResponse(response: Response): Promise<SendMessageResponse> {
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
            }
            if (parsed.message) {
              message = parsed.message as SendMessageResponse['message']
            }
            if (parsed.chat) {
              chat = parsed.chat as SendMessageResponse['chat']
            }
            if (Array.isArray(parsed.sources)) {
              sources = parsed.sources as SendMessageResponse['sources']
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
