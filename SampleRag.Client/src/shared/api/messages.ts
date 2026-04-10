/**
 * Messages API — POST /api/messages (JSON or SSE).
 * Stream frames match server `MessagePartResponse` (camelCase JSON).
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

/** Mirrors server `GenerationStep` (numeric JSON). */
export enum GenerationStep {
  Unknown = 0,
  AiThinking = 1,
  ToolUsing = 2,
  ToolResult = 3,
  ResponseMessage = 4,
  NewChatName = 5,
}

/** Mirrors server `AiTool` (numeric JSON). */
export enum AiTool {
  Unknown = 0,
  CurrentTime = 1,
  InternalDocumentData = 2,
}

export type ToolCallResponse = {
  tool: AiTool
  arguments?: Record<string, unknown>
}

export type ToolResultResponse = {
  tool: AiTool
  value?: unknown
}

/**
 * One SSE `data:` JSON object — same shape as server `MessagePartResponse`.
 * Some payloads use `role` for the step enum; we normalize to `step` in {@link parseMessagePart}.
 */
export type MessagePartResponse = {
  text?: string
  createdAt?: string
  step: GenerationStep
  newChatId?: string
  toolsCalls?: ToolCallResponse[]
  toolsResults?: ToolResultResponse[]
}

/** SendMessageRequest — omit/null chatId when starting a new chat. */
export type SendMessageRequestBody = {
  chatId: string | undefined
  scopeId: string | undefined
  text: string
}

export type SendMessageResponse = {
  message: MessageDto
  chat?: ChatDto
  answer: string
  sources: SourceDto[]
}

export type SendMessageOptions = {
  onEvent?: (part: MessagePartResponse) => void
}

/** GetMessagesByModel for POST /messages/filter. */
export type GetMessagesByModel = {
  lastId?: string
  batchSize?: number
  chatId?: string
}

function asGenerationStep(n: number): GenerationStep {
  if (
    n === GenerationStep.AiThinking ||
    n === GenerationStep.ToolUsing ||
    n === GenerationStep.ToolResult ||
    n === GenerationStep.ResponseMessage ||
    n === GenerationStep.NewChatName
  ) {
    return n
  }
  return GenerationStep.Unknown
}

function parseToolCall(raw: unknown): ToolCallResponse | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const tool = typeof o.tool === 'number' ? (o.tool as AiTool) : AiTool.Unknown
  const args = o.arguments
  const arguments_ =
    args && typeof args === 'object' && !Array.isArray(args)
      ? (args as Record<string, unknown>)
      : undefined
  return { tool, arguments: arguments_ }
}

function parseToolResult(raw: unknown): ToolResultResponse | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const tool = typeof o.tool === 'number' ? (o.tool as AiTool) : AiTool.Unknown
  return { tool, value: o.value }
}

/**
 * Parse one SSE JSON object into `MessagePartResponse`.
 * Accepts `step` or legacy `role` for the generation step enum.
 */
export function parseMessagePart(raw: Record<string, unknown>): MessagePartResponse {
  const stepNum = Number(raw.step ?? raw.role ?? 0)
  const step = asGenerationStep(Number.isFinite(stepNum) ? stepNum : 0)

  let newChatId: string | undefined
  if (raw.newChatId !== undefined && raw.newChatId !== null) {
    newChatId = String(raw.newChatId)
  }

  let toolsCalls: ToolCallResponse[] | undefined
  if (Array.isArray(raw.toolsCalls)) {
    const parsed = raw.toolsCalls.map(parseToolCall).filter(Boolean) as ToolCallResponse[]
    if (parsed.length > 0) toolsCalls = parsed
  }

  let toolsResults: ToolResultResponse[] | undefined
  if (Array.isArray(raw.toolsResults)) {
    const parsed = raw.toolsResults
      .map(parseToolResult)
      .filter(Boolean) as ToolResultResponse[]
    if (parsed.length > 0) toolsResults = parsed
  }

  return {
    text: typeof raw.text === 'string' ? raw.text : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    step,
    newChatId,
    toolsCalls,
    toolsResults,
  }
}

/**
 * POST /api/messages — send message. Returns stream (SSE) or 201 JSON.
 */
export async function sendMessage(
  body: SendMessageRequestBody,
  options?: SendMessageOptions,
): Promise<SendMessageResponse> {
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
    return parseSSEResponse(response, body, options)
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
 * Parses SSE stream: each `data:` line is one JSON `MessagePartResponse`.
 */
async function parseSSEResponse(
  response: Response,
  requestBody: SendMessageRequestBody,
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
            const raw = JSON.parse(data) as Record<string, unknown>
            const part = parseMessagePart(raw)
            options?.onEvent?.(part)

            if (part.step === GenerationStep.ResponseMessage && part.text !== undefined) {
              answer += part.text
            }

            if (part.newChatId) {
              const id = part.newChatId
              chat = {
                id,
                name: chat?.id === id ? (chat.name ?? '') : '',
                scopeId: requestBody.scopeId ?? '',
                ownerIds: chat?.ownerIds ?? [],
              }
            }

            if (part.step === GenerationStep.NewChatName && part.text && chat) {
              chat = { ...chat, name: part.text }
            }

            if (raw.message && typeof raw.message === 'object') {
              message = raw.message as SendMessageResponse['message']
            }
            if (raw.chat && typeof raw.chat === 'object') {
              chat = raw.chat as SendMessageResponse['chat']
            }
            if (Array.isArray(raw.sources)) {
              sources = raw.sources as SendMessageResponse['sources']
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
