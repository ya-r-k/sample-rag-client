# State stores — client audit

**Date:** 2026-04-10  
**Scope:** `SampleRag.Client/` (React 19 + Zustand 5). Workspace root: `sample-rag-client`.

---

## Executive summary

All **centralized client stores** use **Zustand** (`create` from `zustand`). There is **no Redux, Jotai, or second global state library**. One store (`auth-store`) lives under `shared/api/` instead of `shared/store/`, which is a **placement inconsistency**.

The dominant pattern is **TanStack Query for server data** plus **Zustand for UI/session and merged “live” chat state** (messages, sidebar chats, generation steps, composer payload). That split is intentional for **SSE streaming** and optimistic sidebar rows, but it **duplicates** server snapshots and requires manual coordination on mutations and deletes.

**Unused store surface:** several actions on `chats-store`, `messages-store`, and `knowledge-scope-store` are never called; `ui-store` persists **theme** and **sidebar** state that **no component reads or writes** yet. **Persisted UI language** can **diverge from `i18next` on full reload** because i18n is initialized with a fixed `lng` and is not hydrated from the store.

---

## 1. Store inventory

| Path | Library | Purpose | Persistence | Notes |
|------|---------|---------|-------------|--------|
| `src/shared/api/auth-store.ts` | Zustand | In-memory JWT `accessToken` | None | Used from `token-manager.ts` via `getState()` |
| `src/shared/store/chats-store.ts` | Zustand | Chat list for sidebar + metadata (`lastLoadedAt`, `clientOptimistic`) | None | Merged from Query + `upsertChat` during send |
| `src/shared/store/messages-store.ts` | Zustand | Messages keyed by `chatId`; streaming/final merge helpers | None | Hydrated from Query; updated during SSE |
| `src/shared/store/message-generation-steps-store.ts` | Zustand | Per-turn / per-message “reasoning & tool” steps (client-only) | None | Cleared on chat delete |
| `src/shared/store/message-submission-store.ts` | Zustand | Composer: `text`, `chatId`, `scopeId` (form payload) | None | Aligns with project form-state rules |
| `src/shared/store/knowledge-scope-store.ts` | Zustand | Scope list for scope selector | None | Filled from Query in `scope-selector.hook.ts` |
| `src/shared/store/ui-store.ts` | Zustand + `persist` | Theme, language, sidebar collapsed | `localStorage` key `ui-store` | Only **language** wired in `header.tsx` |

No `devtools`, `subscribeWithSelector`, or `immer` middleware is used; updates are **immutable** via object spreads.

---

## 2. Library and pattern consistency

### Single library

**Zustand only** for global mutable UI/domain client state — **good consistency.**

### Placement and naming

- **`use*Store`** naming is consistent.
- **`auth-store.ts` under `shared/api/`** breaks the mental model “all stores in `shared/store/`”. **Recommendation:** move to `shared/store/auth-store.ts` and re-export from API layer if needed, or document the exception.

### Typing and updates

Stores use explicit `type` state shapes and **functional `set((state) => …)`** updates — appropriate for Zustand 5.

### Overlap with React Query

Three areas mirror Query results into Zustand:

| Data | Query key (examples) | Store |
|------|----------------------|--------|
| Chats | `['chats', 20]` | `useChatsStore` |
| Messages | `['chat-messages', chatId]` | `useMessagesStore` |
| Scopes | `['groups']` | `useKnowledgeScopeStore` |

This is a **deliberate hybrid** (especially for **streaming message text** and **optimistic chats**). The cost is **two sources of truth** and the need to **invalidate + patch stores** together (see `delete-chat.ts`).

---

## 3. Best-practice assessment (by cluster)

### Auth (`useAuthStore`)

- **Minimal surface** — fine for a token bucket.
- **Non-React access** from `token-manager` via `getState()` is correct for fetch interceptors.
- **Security** is covered in API audit; store itself does not mishandle secrets beyond holding the token in memory.

### Chats + messages (chat feature)

- **`mergeChatsFromServer`** preserves `clientOptimistic` rows — **good** for refetch race with new chats.
- **`messages-store`** centralizes tricky streaming/finalize logic — **reduces** scatter in components.
- **Unused actions** (never referenced outside the store file): `renameChatId`, `setOptimisticTurn` (`messages-store`); `addChats`, `replaceChatId` (`chats-store`). Either **wire them** for future optimistic-ID flows or **remove** to reduce API surface.

### Message generation steps

- Clear separation: **pending by `turnId`** → **committed `byMessageId`**; **`clearChat`** removes orphaned turns — **solid** for SSE UI.
- `message-generation-steps.tsx` uses **multiple** `useMessageGenerationStepsStore` selectors in one helper; each subscription is **narrow** enough, but you could later **combine with `useShallow`** if profiling shows churn.

### Message submission store

- Used by `query-input.hook.ts` with **atomic selectors** (`s.text`, `s.setText`) — **avoids** broad re-renders.
- `scopeId` is still **local `useState`** in the hook while `chatId`/`scopeId` sync into the store via `setForm` — **slight split** between local and global form state; acceptable but worth documenting (scope is UI-local until synced).

### Knowledge scope store

- Only **`scopes` + `setScopes`** are used (`scope-selector.hook.ts`). **`addScopes`, `upsertScope`, `removeScope`, `clearScopes`** are **dead** — remove or use when scopes page / mutations should update the combobox without refetch.

### UI store (`persist`)

```16:29:SampleRag.Client/src/shared/store/ui-store.ts
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'ru',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    {
      name: 'ui-store',
    },
  ),
)
```

- **Theme / sidebar** have **no consumers** — dead persisted keys.
- **Language:** `header.tsx` updates both **store** and **`i18n.changeLanguage`**, but **`shared/lib/i18n/index.ts`** initializes with fixed `lng: 'ru'` and does **not** read persisted language — **desync on reload** if user chose EN.

---

## 4. Overlaps and refactoring suggestions

1. **Query cache vs. Zustand for lists**  
   - **Option A (incremental):** Keep current pattern; **centralize query keys** and document “after every mutation: invalidate + update store” (already done in `delete-chat.ts`).  
   - **Option B:** Use **Query as canonical** for chats/scopes/messages and drive UI from `useQuery` data **plus** a thin “streaming overlay” store **only** for in-flight tokens (smaller Zustand footprint).

2. **Duplicate `ChatDto` / message types**  
   - `messages.ts` and `chats.ts` both declare `ChatDto` / `MessageDto`-like shapes — not a store issue per se, but stores amplify **drift risk**. Prefer **single DTO imports** in stores (messages store already imports from `messages` API).

3. **Unused store methods**  
   - Prune or implement **`renameChatId` / `setOptimisticTurn` / `addChats` / `replaceChatId`** and knowledge-scope **mutators** to avoid misleading contributors.

4. **Auth store location**  
   - Move **`auth-store.ts`** next to other stores for **one place to look**.

---

## 5. Usage in components and hooks

| Consumer | Stores used | Pattern |
|----------|-------------|---------|
| `chat-page.hook.ts` | messages, chats | Selectors + `getState()` in `useEffect` to sync Query → store |
| `chat-sidebar.hook.ts` | chats | Selector + effect merge from Query |
| `query-input.hook.ts` | message-submission, chats | Fine-grained selectors |
| `scope-selector.hook.ts` | knowledge-scope | Effect sync from Query |
| `submit-chat-message.ts` | chats, messages, message-generation-steps | **Imperative** `getState()` — appropriate for async orchestration |
| `delete-chat.ts` | chats, messages, message-generation-steps | **Imperative** + Query invalidation |
| `chat-heading.tsx` | chats | Selector on `chats` array — **re-renders when any chat changes** (acceptable for small lists) |
| `message-generation-steps.tsx` | message-generation-steps | Multiple selectors inside hook |
| `header.tsx` | ui | Language only |

**No obvious React rule violations** (no `setState` inside Zustand setters, etc.). **Business logic** for send/delete is correctly pushed to **modules + stores**, not into presentational components.

**Minor:** `chat-heading` subscribing to **full `chats`** could be optimized with a **selector by `chatId`** if the list grows large.

---

## 6. Findings by severity

### Critical

- None identified **inside stores** for correctness under normal single-tab use. (Concurrency / SSE races are broader app concerns.)

### High

1. **i18n vs. persisted `language` mismatch on reload** — User sees wrong language until they toggle. **Fix:** On app init, `i18n.changeLanguage(useUiStore.getState().language)` (or read `localStorage` parse for `ui-store`) after `init`, or drive `lng` from persisted state in `i18n.init`.

### Medium

2. **Duplicate server state** (Query + Zustand) for chats, messages, scopes — Maintainability cost; every new flow must update both. **Mitigate** with shared helpers or moving toward Query-first where streaming allows.

3. **Dead store API** — Unused methods on `chats-store`, `messages-store`, `knowledge-scope-store` confuse readers. **Remove or use.**

4. **`auth-store` path** under `api/` — Inconsistent with `shared/store/`. **Relocate** for discoverability.

### Low / quick wins

5. **`ui-store`:** Wire **theme** (and **sidebar**) to layout/header, or stop persisting unused fields.  
6. **`chat-heading`:** Narrow selector by active `chatId` if needed for performance.  
7. **`useShallow`:** Optional consolidation of generation-steps subscriptions if re-renders matter.  
8. **Tests:** No store unit tests found — add for **merge/replace/clear** invariants if regressions appear.

---

## 7. Recommended next steps (prioritized)

1. **Fix language hydration** so `i18next` matches persisted `useUiStore` language on startup.  
2. **Decide** on unused store methods: **delete** or **document + use** in optimistic-ID flows.  
3. **Move `auth-store.ts`** to `shared/store/` (update imports).  
4. **Either implement theme/sidebar** from `ui-store` or **trim persist payload** to only what the UI uses.  
5. **Document** the Query+Zustand split in a short ADR or `project.md` so new features follow the same invalidation + store update pattern.

---

*End of report.*
