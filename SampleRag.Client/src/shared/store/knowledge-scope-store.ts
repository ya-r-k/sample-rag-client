import { create } from 'zustand'
import type { ScopeDto } from '../api/scopes'

type KnowledgeScopeState = {
  scopes: ScopeDto[]
  setScopes: (scopes: ScopeDto[]) => void
  addScopes: (scopes: ScopeDto[]) => void
  upsertScope: (scope: ScopeDto) => void
  removeScope: (scopeId: string) => void
  clearScopes: () => void
}

export const useKnowledgeScopeStore = create<KnowledgeScopeState>()((set) => ({
  scopes: [],

  setScopes: (scopes) => set({ scopes }),

  addScopes: (scopes) =>
    set((state) => {
      const seen = new Set(state.scopes.map((scope) => scope.id))
      const toAdd = scopes.filter((scope) => !seen.has(scope.id))
      return { scopes: [...state.scopes, ...toAdd] }
    }),

  upsertScope: (scope) =>
    set((state) => {
      const index = state.scopes.findIndex((item) => item.id === scope.id)
      if (index === -1) {
        return { scopes: [scope, ...state.scopes] }
      }
      const next = [...state.scopes]
      next[index] = scope
      return { scopes: next }
    }),

  removeScope: (scopeId) =>
    set((state) => ({
      scopes: state.scopes.filter((scope) => scope.id !== scopeId),
    })),

  clearScopes: () => set({ scopes: [] }),
}))
