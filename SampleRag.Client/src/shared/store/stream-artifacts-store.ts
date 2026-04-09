import { create } from 'zustand'

/** Non-user-visible stream payload (reasoning, retrieval, tools, etc.). */
export type StreamArtifact =
  | {
      type: 'reasoning'
      text?: string
      payload?: unknown
      at: number
    }
  | {
      type: 'retrieval'
      text?: string
      payload?: unknown
      at: number
    }
  | {
      type: 'tool'
      text?: string
      payload?: unknown
      at: number
    }

export type StreamTurnBucket = {
  chatId: string
  turnId: string
  items: StreamArtifact[]
}

type StreamArtifactsState = {
  /** Key: `${chatId}:${turnId}` */
  turns: Record<string, StreamTurnBucket>
  startTurn: (chatId: string, turnId: string) => void
  appendArtifact: (
    chatId: string,
    turnId: string,
    artifact: Omit<StreamArtifact, 'at'> & { at?: number },
  ) => void
  clearTurn: (chatId: string, turnId: string) => void
  clearChatArtifacts: (chatId: string) => void
  /** After optimistic chat id is replaced by the server id, move the turn bucket. */
  rebindTurnChatId: (
    oldChatId: string,
    newChatId: string,
    turnId: string,
  ) => void
}

function turnKey(chatId: string, turnId: string) {
  return `${chatId}:${turnId}`
}

export const useStreamArtifactsStore = create<StreamArtifactsState>()((set) => ({
  turns: {},

  startTurn: (chatId, turnId) =>
    set((state) => ({
      turns: {
        ...state.turns,
        [turnKey(chatId, turnId)]: { chatId, turnId, items: [] },
      },
    })),

  appendArtifact: (chatId, turnId, artifact) =>
    set((state) => {
      const key = turnKey(chatId, turnId)
      const bucket = state.turns[key] ?? { chatId, turnId, items: [] }
      const withAt = { ...artifact, at: artifact.at ?? Date.now() } as StreamArtifact
      return {
        turns: {
          ...state.turns,
          [key]: { ...bucket, items: [...bucket.items, withAt] },
        },
      }
    }),

  clearTurn: (chatId, turnId) =>
    set((state) => {
      const key = turnKey(chatId, turnId)
      const { [key]: _, ...rest } = state.turns
      return { turns: rest }
    }),

  clearChatArtifacts: (chatId) =>
    set((state) => {
      const next: Record<string, StreamTurnBucket> = {}
      for (const [k, v] of Object.entries(state.turns)) {
        if (v.chatId !== chatId) next[k] = v
      }
      return { turns: next }
    }),

  rebindTurnChatId: (oldChatId, newChatId, turnId) =>
    set((state) => {
      const oldK = turnKey(oldChatId, turnId)
      const bucket = state.turns[oldK]
      if (!bucket) return state
      const { [oldK]: _, ...rest } = state.turns
      const newK = turnKey(newChatId, turnId)
      return {
        turns: {
          ...rest,
          [newK]: { ...bucket, chatId: newChatId },
        },
      }
    }),
}))
