import { create } from 'zustand'
import type { ChatDto } from '../api/chats'

/** Sidebar row; `lastLoadedAt` is client metadata (e.g. last messages fetch). */
export type ChatListEntry = ChatDto & {
  lastLoadedAt?: number
  /** True until server assigns a real chat (optimistic id replaced). */
  clientOptimistic?: boolean
}

type ChatsState = {
  chats: ChatListEntry[]
  /** Replace entire list (e.g. reset). */
  setChats: (chats: ChatDto[]) => void
  /**
   * Merge server list while keeping optimistic rows not yet present on the server
   * (avoids wiping a provisional chat on background refetch).
   */
  mergeChatsFromServer: (server: ChatDto[]) => void
  upsertChat: (chat: ChatDto, options?: { clientOptimistic?: boolean }) => void
  /** Prepend new chats; skip ids already present (first occurrence wins). */
  addChats: (chats: ChatDto[]) => void
  setChatLastLoadedAt: (chatId: string, loadedAt: number) => void
  removeChat: (chatId: string) => void
  /** Swap optimistic id for server chat; preserves order when possible. */
  replaceChatId: (oldId: string, chat: ChatDto) => void
}

function toEntry(
  chat: ChatDto,
  prev?: ChatListEntry,
  clientOptimistic?: boolean,
): ChatListEntry {
  return {
    ...chat,
    lastLoadedAt: prev?.lastLoadedAt,
    clientOptimistic:
      clientOptimistic ?? prev?.clientOptimistic ?? false,
  }
}

export const useChatsStore = create<ChatsState>()((set) => ({
  chats: [],

  setChats: (chats) =>
    set({
      chats: chats.map((c) => toEntry(c)),
    }),

  mergeChatsFromServer: (server) =>
    set((state) => {
      const serverIds = new Set(server.map((c) => c.id))
      const pending = state.chats.filter(
        (c) => c.clientOptimistic === true && !serverIds.has(c.id),
      )
      const merged: ChatListEntry[] = server.map((c) => {
        const existing = state.chats.find((x) => x.id === c.id)
        return toEntry(c, existing, false)
      })
      return { chats: [...pending, ...merged] }
    }),

  upsertChat: (chat, options) =>
    set((state) => {
      const next = [...state.chats]
      const i = next.findIndex((c) => c.id === chat.id)
      const prev = i >= 0 ? next[i] : undefined
      const entry = toEntry(chat, prev, options?.clientOptimistic)
      if (i >= 0) {
        next[i] = entry
        return { chats: next }
      }
      return { chats: [entry, ...next] }
    }),

  addChats: (chats) =>
    set((state) => {
      const seen = new Set(state.chats.map((c) => c.id))
      const toAdd: ChatListEntry[] = []
      for (const c of chats) {
        if (seen.has(c.id)) continue
        seen.add(c.id)
        toAdd.push(toEntry(c))
      }
      return { chats: [...toAdd, ...state.chats] }
    }),

  setChatLastLoadedAt: (chatId, loadedAt) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, lastLoadedAt: loadedAt } : c,
      ),
    })),

  removeChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
    })),

  replaceChatId: (oldId, chat) =>
    set((state) => {
      const prev = state.chats.find((c) => c.id === oldId)
      const without = state.chats.filter((c) => c.id !== oldId)
      const existingNew = without.findIndex((c) => c.id === chat.id)
      const entry = toEntry(chat, prev, false)
      if (existingNew >= 0) {
        const next = [...without]
        next[existingNew] = {
          ...entry,
          lastLoadedAt: without[existingNew].lastLoadedAt ?? entry.lastLoadedAt,
        }
        return { chats: next }
      }
      const insertAt = prev
        ? Math.min(
            state.chats.findIndex((c) => c.id === oldId),
            without.length,
          )
        : 0
      const next = [...without]
      next.splice(insertAt, 0, entry)
      return { chats: next }
    }),
}))
