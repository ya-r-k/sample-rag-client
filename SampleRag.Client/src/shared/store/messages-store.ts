import { create } from 'zustand'
import {
  GenerationStep,
  type MessageDto,
  type MessagePartResponse,
  type SendMessageResponse,
  type SourceDto,
} from '../api/messages'

type MessagesState = {
  byChatId: Record<string, MessageDto[]>
  setMessagesForChat: (chatId: string, messages: MessageDto[]) => void
  appendMessagesForChat: (chatId: string, messages: MessageDto[]) => void
  removeMessagesForChat: (chatId: string) => void
  renameChatId: (oldId: string, newId: string) => void
  /** Replace placeholders for a new optimistic thread. */
  setOptimisticTurn: (chatId: string, userText: string) => void
  /** Append user + empty assistant to an existing thread. */
  appendUserAndAssistantPlaceholders: (chatId: string, userText: string) => void
  /**
   * When server sends chat first time: ensure thread has user + assistant rows
   * if cache was empty (e.g. keyed by real id).
   */
  seedMessagesIfEmpty: (chatId: string, userText: string) => void
  /** Apply one streamed `MessagePartResponse` (assistant text only for `ResponseMessage`). */
  applyMessagePart: (
    chatId: string,
    part: MessagePartResponse,
    userText: string,
  ) => void
  finalizeSendResponse: (chatId: string, result: SendMessageResponse) => void
}

function ensureAssistantMessage(
  items: MessageDto[],
  targetChatId: string,
  userText: string,
): { next: MessageDto[]; assistantIndex: number } {
  const userItem: MessageDto = { text: userText, aiGenerated: false, chatId: targetChatId }
  const assistantItem: MessageDto = {
    text: '',
    aiGenerated: true,
    sourceReferences: [],
    chatId: targetChatId,
  }
  const next = [...items]
  if (next.length === 0) {
    next.push({ ...userItem })
  }
  const assistantIndex = next.findIndex(
    (item) => item.aiGenerated === true && !item.id,
  )
  if (assistantIndex >= 0) {
    return { next, assistantIndex }
  }
  next.push({ ...assistantItem })
  return { next, assistantIndex: next.length - 1 }
}

export const useMessagesStore = create<MessagesState>()((set) => ({
  byChatId: {},

  setMessagesForChat: (chatId, messages) =>
    set((state) => ({
      byChatId: { ...state.byChatId, [chatId]: messages },
    })),

  appendMessagesForChat: (chatId, messages) =>
    set((state) => {
      const prev = state.byChatId[chatId] ?? []
      return {
        byChatId: {
          ...state.byChatId,
          [chatId]: [...prev, ...messages],
        },
      }
    }),

  removeMessagesForChat: (chatId) =>
    set((state) => {
      const { [chatId]: _, ...rest } = state.byChatId
      return { byChatId: rest }
    }),

  renameChatId: (oldId, newId) =>
    set((state) => {
      const msgs = state.byChatId[oldId]
      if (!msgs) {
        return state
      }
      const { [oldId]: _removed, ...rest } = state.byChatId
      const relabeled = msgs.map((m) => ({ ...m, chatId: newId }))
      return {
        byChatId: {
          ...rest,
          [newId]: relabeled,
        },
      }
    }),

  setOptimisticTurn: (chatId, userText) =>
    set((state) => ({
      byChatId: {
        ...state.byChatId,
        [chatId]: [
          { text: userText, aiGenerated: false, chatId },
          {
            text: '',
            aiGenerated: true,
            sourceReferences: [],
            chatId,
          },
        ],
      },
    })),

  appendUserAndAssistantPlaceholders: (chatId, userText) =>
    set((state) => {
      const prev = state.byChatId[chatId] ?? []
      return {
        byChatId: {
          ...state.byChatId,
          [chatId]: [
            ...prev,
            { text: userText, aiGenerated: false, chatId },
            {
              text: '',
              aiGenerated: true,
              sourceReferences: [],
              chatId,
            },
          ],
        },
      }
    }),

  seedMessagesIfEmpty: (chatId, userText) =>
    set((state) => {
      const prev = state.byChatId[chatId] ?? []
      if (prev.length > 0) {
        return state
      }
      return {
        byChatId: {
          ...state.byChatId,
          [chatId]: [
            { text: userText, aiGenerated: false, chatId },
            {
              text: '',
              aiGenerated: true,
              sourceReferences: [],
              chatId,
            },
          ],
        },
      }
    }),

  applyMessagePart: (chatId, part, userText) =>
    set((state) => {
      const prev = state.byChatId[chatId] ?? []
      const { next, assistantIndex } = ensureAssistantMessage(prev, chatId, userText)
      const currentAssistant = next[assistantIndex]

      // Apply text for ResponseMessage step
      if (part.step === GenerationStep.ResponseMessage && part.text !== undefined) {
        const currentText = currentAssistant.text ?? ''
        next[assistantIndex] = {
          ...currentAssistant,
          chatId,
          aiGenerated: true,
          text: `${currentText}${part.text}`,
        }
      }

      return {
        byChatId: {
          ...state.byChatId,
          [chatId]: next,
        },
      }
    }),

  finalizeSendResponse: (chatId, result) =>
    set((state) => {
      const prev = state.byChatId[chatId] ?? []
      const userText =
        [...prev].reverse().find((m) => m.aiGenerated === false)?.text ?? ''
      const { next, assistantIndex } = ensureAssistantMessage(prev, chatId, userText)
      const msg = result.message
      const rawSources = result.sources?.length
        ? result.sources
        : (msg as MessageDto & { sources?: SourceDto[] }).sourceReferences ??
          (msg as MessageDto & { sources?: SourceDto[] }).sources
      next[assistantIndex] = {
        ...next[assistantIndex],
        ...msg,
        chatId,
        aiGenerated: true,
        text: result.answer || next[assistantIndex].text,
        sourceReferences:
          rawSources && rawSources.length > 0
            ? rawSources
            : next[assistantIndex].sourceReferences,
      }
      return {
        byChatId: {
          ...state.byChatId,
          [chatId]: next,
        },
      }
    }),
}))
