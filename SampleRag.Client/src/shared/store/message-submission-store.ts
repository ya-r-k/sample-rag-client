import { create } from 'zustand'

type MessageSubmissionState = {
  chatId: string | null
  scopeId: string | null
  text: string
  setChatId: (chatId: string | null) => void
  setScopeId: (scopeId: string | null) => void
  setText: (text: string) => void
  setForm: (payload: {
    chatId?: string | null
    scopeId?: string | null
    text?: string
  }) => void
  reset: () => void
}

export const useMessageSubmissionStore = create<MessageSubmissionState>()((set) => ({
  chatId: null,
  scopeId: null,
  text: '',

  setChatId: (chatId) => set({ chatId }),
  setScopeId: (scopeId) => set({ scopeId }),
  setText: (text) => set({ text }),
  setForm: (payload) =>
    set((state) => ({
      chatId: payload.chatId ?? state.chatId,
      scopeId: payload.scopeId ?? state.scopeId,
      text: payload.text ?? state.text,
    })),
  reset: () =>
    set({
      chatId: null,
      scopeId: null,
      text: '',
    }),
}))
