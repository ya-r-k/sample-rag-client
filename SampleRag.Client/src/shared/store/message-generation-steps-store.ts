import { create } from 'zustand'
import {
  AiTool,
  GenerationStep,
  type MessagePartResponse,
} from '../api/messages'

export type ReasoningStepItem = {
  id: string
  kind: 'reasoning'
  text: string
}

export type ToolStepItem = {
  id: string
  kind: 'tool'
  tool: AiTool
  arguments?: Record<string, unknown>
  result?: unknown
}

export type MessageGenerationStepItem = ReasoningStepItem | ToolStepItem

type TurnMeta = {
  chatId: string
}

type MessageGenerationStepsState = {
  /** Assistant message id → ordered steps (client-only, not from DB). */
  byMessageId: Record<string, MessageGenerationStepItem[]>
  /** In-flight steps before the assistant message has an id. */
  pendingByTurnId: Record<string, MessageGenerationStepItem[]>
  turnMeta: Record<string, TurnMeta>
  activeTurnId: string | null
  streamPhaseByTurnId: Record<string, 'pre_answer' | 'final_answer'>
  /** Message ids committed during a chat (for cleanup on chat delete). */
  messageIdsByChatId: Record<string, string[]>

  startTurn: (turnId: string, chatId: string) => void
  updateTurnChatId: (turnId: string, chatId: string) => void
  appendStreamPart: (turnId: string, part: MessagePartResponse) => void
  commitTurnToMessage: (turnId: string, messageId: string) => void
  finishTurn: (turnId: string) => void
  clearTurn: (turnId: string) => void
  clearChat: (chatId: string) => void
}

function newStepId() {
  return crypto.randomUUID()
}

function appendReasoning(
  items: MessageGenerationStepItem[],
  text: string,
): MessageGenerationStepItem[] {
  if (!text) return items
  const next = [...items]
  const last = next[next.length - 1]
  if (last?.kind === 'reasoning') {
    next[next.length - 1] = {
      ...last,
      text: last.text + text,
    }
    return next
  }
  next.push({ id: newStepId(), kind: 'reasoning', text })
  return next
}

function appendToolCalls(
  items: MessageGenerationStepItem[],
  calls: NonNullable<MessagePartResponse['toolsCalls']>,
): MessageGenerationStepItem[] {
  const next = [...items]
  for (const c of calls) {
    next.push({
      id: newStepId(),
      kind: 'tool',
      tool: c.tool,
      arguments: c.arguments,
    })
  }
  return next
}

function mergeToolResults(
  items: MessageGenerationStepItem[],
  results: NonNullable<MessagePartResponse['toolsResults']>,
): MessageGenerationStepItem[] {
  const next = [...items]
  for (const r of results) {
    let merged = false
    for (let i = next.length - 1; i >= 0; i--) {
      const it = next[i]
      if (it.kind === 'tool' && it.tool === r.tool && it.result === undefined) {
        next[i] = { ...it, result: r.value }
        merged = true
        break
      }
    }
    if (!merged) {
      next.push({
        id: newStepId(),
        kind: 'tool',
        tool: r.tool,
        result: r.value,
      })
    }
  }
  return next
}

export const useMessageGenerationStepsStore = create<MessageGenerationStepsState>()(
  (set) => ({
    byMessageId: {},
    pendingByTurnId: {},
    turnMeta: {},
    activeTurnId: null,
    streamPhaseByTurnId: {},
    messageIdsByChatId: {},

    startTurn: (turnId, chatId) =>
      set((state) => ({
        activeTurnId: turnId,
        pendingByTurnId: { ...state.pendingByTurnId, [turnId]: [] },
        turnMeta: { ...state.turnMeta, [turnId]: { chatId } },
        streamPhaseByTurnId: { ...state.streamPhaseByTurnId, [turnId]: 'pre_answer' },
      })),

    updateTurnChatId: (turnId, chatId) =>
      set((state) => {
        if (!state.turnMeta[turnId]) return state
        return {
          turnMeta: { ...state.turnMeta, [turnId]: { chatId } },
        }
      }),

    appendStreamPart: (turnId, part) =>
      set((state) => {
        const bucket = state.pendingByTurnId[turnId]
        if (!bucket) return state

        let items = bucket
        let phase = state.streamPhaseByTurnId[turnId] ?? 'pre_answer'

        if (part.step === GenerationStep.ResponseMessage) {
          phase = 'final_answer'
        }

        switch (part.step) {
          case GenerationStep.AiThinking:
            if (part.text) {
              items = appendReasoning(items, part.text)
            }
            break
          case GenerationStep.ToolUsing:
            if (part.toolsCalls?.length) {
              items = appendToolCalls(items, part.toolsCalls)
            }
            break
          case GenerationStep.ToolResult:
            if (part.toolsResults?.length) {
              items = mergeToolResults(items, part.toolsResults)
            }
            break
          default:
            break
        }

        return {
          pendingByTurnId: { ...state.pendingByTurnId, [turnId]: items },
          streamPhaseByTurnId: { ...state.streamPhaseByTurnId, [turnId]: phase },
        }
      }),

    commitTurnToMessage: (turnId, messageId) =>
      set((state) => {
        const pending = state.pendingByTurnId[turnId]
        if (!pending?.length) {
          const { [turnId]: _p, ...restPending } = state.pendingByTurnId
          const { [turnId]: _m, ...restMeta } = state.turnMeta
          const { [turnId]: _ph, ...restPhase } = state.streamPhaseByTurnId
          return {
            pendingByTurnId: restPending,
            turnMeta: restMeta,
            streamPhaseByTurnId: restPhase,
          }
        }
        const chatId = state.turnMeta[turnId]?.chatId
        const { [turnId]: _removed, ...restPending } = state.pendingByTurnId
        const { [turnId]: _rm, ...restMeta } = state.turnMeta
        const { [turnId]: _rph, ...restPhase } = state.streamPhaseByTurnId
        const messageIdsByChatId = { ...state.messageIdsByChatId }
        if (chatId) {
          const prev = messageIdsByChatId[chatId] ?? []
          if (!prev.includes(messageId)) {
            messageIdsByChatId[chatId] = [...prev, messageId]
          }
        }
        return {
          byMessageId: { ...state.byMessageId, [messageId]: pending },
          pendingByTurnId: restPending,
          turnMeta: restMeta,
          streamPhaseByTurnId: restPhase,
          messageIdsByChatId,
        }
      }),

    finishTurn: (turnId) =>
      set((state) => {
        if (state.activeTurnId !== turnId) return state
        return { activeTurnId: null }
      }),

    clearTurn: (turnId) =>
      set((state) => {
        const { [turnId]: _a, ...restPending } = state.pendingByTurnId
        const { [turnId]: _b, ...restMeta } = state.turnMeta
        const { [turnId]: _c, ...restPhase } = state.streamPhaseByTurnId
        const activeTurnId = state.activeTurnId === turnId ? null : state.activeTurnId
        return {
          pendingByTurnId: restPending,
          turnMeta: restMeta,
          streamPhaseByTurnId: restPhase,
          activeTurnId,
        }
      }),

    clearChat: (chatId) =>
      set((state) => {
        const messageIds = state.messageIdsByChatId[chatId] ?? []
        const byMessageId = { ...state.byMessageId }
        for (const id of messageIds) {
          delete byMessageId[id]
        }
        const { [chatId]: _, ...restMsgMap } = state.messageIdsByChatId

        const pendingByTurnId = { ...state.pendingByTurnId }
        const turnMeta = { ...state.turnMeta }
        const streamPhaseByTurnId = { ...state.streamPhaseByTurnId }
        let activeTurnId = state.activeTurnId

        for (const [tid, meta] of Object.entries(state.turnMeta)) {
          if (meta.chatId === chatId) {
            delete pendingByTurnId[tid]
            delete turnMeta[tid]
            delete streamPhaseByTurnId[tid]
            if (activeTurnId === tid) activeTurnId = null
          }
        }

        return {
          byMessageId,
          messageIdsByChatId: restMsgMap,
          pendingByTurnId,
          turnMeta,
          streamPhaseByTurnId,
          activeTurnId,
        }
      }),
  }),
)
