# External services, HTTP API, and auth — client audit

**Date:** 2026-04-10  
**Scope:** `SampleRag.Client/` (React + Vite). Workspace root: `sample-rag-client`.

---

## Executive summary

The client uses a **single HTTP transport**: native **`fetch`** wrapped by **`authorizedFetch`** (`token-manager.ts`) and thin helpers **`apiGet` / `apiPost` / `apiDelete`** (`client.ts`). **TanStack Query** orchestrates caching and mutations in pages/features. **`axios` is listed in `package.json` but is not imported anywhere** — dead dependency.

Strengths: centralized auth header injection, 401 retry with token refresh, domain modules under `shared/api/` with typed DTOs, and **partial runtime parsing** for SSE frames in `messages.ts`.

Main risks: **hard-coded demo login credentials** in the token fetch path (unacceptable outside local demos), **no `AbortSignal`** wiring for long SSE sends or queries, **errors thrown as plain `Error`** so Query’s retry logic never sees HTTP status, and **broad `as T` JSON casts** without runtime validation on most endpoints.

---

## 1. Inventory

### Environment variables

| Variable | Where used | Notes |
|----------|------------|--------|
| `VITE_API_BASE_URL` | `SampleRag.Client/src/shared/api/token-manager.ts` | Prepended to all API paths. Public in bundle. |
| `VITE_AUTH_LOGIN_URL` | `token-manager.ts` | Login endpoint for JWT acquisition. Public in bundle. |

No `.env.example` was found at workspace root via search; README documents Docker/`VITE_*` at a high level.

### HTTP stack

| Layer | Role |
|-------|------|
| `fetch` | All outbound HTTP and auth login POST. |
| `authorizedFetch` | Adds `Authorization: Bearer`, `credentials: 'include'`, handles missing token + 401 retry. |
| `apiGet` / `apiPost` / `apiDelete` | JSON helpers on top of `authorizedFetch`. |
| `@tanstack/react-query` | `useQuery` / `useMutation` in pages and features; `QueryClient` defaults in `app/providers/query-provider.tsx`. |
| `axios` | **Dependency only** — no usage in `src/`. |

### API modules (`src/shared/api/`)

| Module | Endpoints / behavior |
|--------|----------------------|
| `client.ts` | Generic JSON GET/POST/DELETE. |
| `token-manager.ts` | JWT acquisition + `authorizedFetch`. |
| `auth-store.ts` | Zustand: in-memory `accessToken`. |
| `messages.ts` | POST `/api/messages` (JSON or SSE), POST `/api/messages/filter`; SSE parsing + `parseMessagePart`. |
| `chats.ts` | Chats CRUD-style via filter/create/owners/delete. |
| `documents.ts` | Documents filter/upload/delete; `getDocumentAssetBlob` GET `/api/files/...`. |
| `scopes.ts` | Knowledge scopes filter/create/users. |
| `feedbacks.ts` | Submit + filter feedback — **no UI imports found**. |

### Vite

`vite.config.ts` has no `server.proxy`; the client calls `API_BASE_URL` directly from the browser (CORS must be allowed on the API).

---

## 2. Request and response handling

### Errors

`client.ts` throws a generic error on non-OK responses:

```8:10:SampleRag.Client/src/shared/api/client.ts
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
```

There is **no structured error type** (no `status`, `body`, or parsed problem+json). Callers and React Query retries cannot branch on status without string parsing.

### React Query retries vs. real errors

`query-provider.tsx` disables retries when `error.status` is 401/403:

```7:18:SampleRag.Client/src/app/providers/query-provider.tsx
      retry(failureCount, error: unknown) {
        const status =
          typeof error === 'object' && error !== null && 'status' in error
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (error as any).status
            : undefined

        if (status === 401 || status === 403) {
          return false
        }

        return failureCount < 3
```

Because API helpers throw `new Error(...)`, **`status` is almost never present** — this branch is effectively dead for fetch failures. Retries will run up to three times even for 401/403 from the API.

### Typing and validation

- Most responses: `(await response.json()) as T` — **compile-time only**; malformed or schema-drifting JSON surfaces at runtime as undefined behavior.
- **SSE path** in `messages.ts` uses `parseMessagePart` and small guards — **good pattern** for streamed events; JSON `SendMessageResponse` branch remains asserted.
- `apiPost` for **204** returns `{} as TResponse` — convenient but **masks** “no body” vs. wrong status.

### Cancellation and timeouts

- **`authorizedFetch` / `apiPost` / `sendMessage` do not accept or forward `AbortSignal`** from React Query’s `signal` or from UI unmount. Long **`sendMessage` SSE** reads can continue after navigation unless separately aborted (they are not).
- No explicit **fetch timeouts** (browser default applies).

### Dedupe and cache

- TanStack Query handles **deduplication** for identical `queryKey`s.
- **Dual source of truth**: server lists are fetched with Query, then **copied into Zustand** in effects (`chat-page.hook.ts`, `chat-sidebar.hook.ts`). Invalidation must stay aligned with manual store updates (e.g. `delete-chat.ts` invalidates `CHATS_QUERY_KEY` and clears stores).

---

## 3. Auth and external identity

### Flow

1. `useAuthStore` holds `accessToken` in memory (lost on full page reload).
2. `authorizedFetch` loads token from store; if missing, calls `fetchJwtToken()`.
3. On **401**, `fetchJwtToken()` runs again and retries the request once.

### Security-relevant findings

- **`fetchJwtToken` embeds fixed demo user fields** (`userId`, `email`, `password`, etc.) in client code. Anyone with the bundle can see this. **Treat as demo-only**; real apps need interactive login or a secure token handoff, not secrets in source.
- **`credentials: 'include'`** on API and login requests: appropriate only if cookies are part of the design; ensure SameSite/CORS are correctly configured on the API.
- **JWT in Zustand (memory)** avoids localStorage XSS persistence tradeoffs but **does not survive refresh** — UX may re-hit login endpoint often.

```6:20:SampleRag.Client/src/shared/api/token-manager.ts
async function fetchJwtToken(): Promise<string | null> {
  try {
    const response = await fetch(AUTH_LOGIN_URL, {
      method: 'POST',
      body: JSON.stringify({
        userId: '1',
        email: 'admin@example.com',
        role: 'Admin',
        password: 'admin',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
```

---

## 4. Library overlap and unification strategy

| Finding | Recommendation |
|---------|----------------|
| **`axios` unused** | **Remove** from `dependencies` or adopt it deliberately for interceptors — current codebase is consistently **fetch-based**. |
| **Query + manual Zustand sync** | Not a “library conflict,” but a **pattern split**: server state vs. UI state. Prefer either **Query as source of truth** with selectors, or **document** why Zustand mirrors are required (e.g. streaming merge). Long term, reduce duplicate sync effects. |

**Suggested target shape:** keep **`authorizedFetch` + small JSON helpers** as the single low-level client; optionally introduce a **`HttpError` class** with `status` and `body` for Query and UI; add **`signal`** threading from Query `queryFn`/`mutationFn` into `authorizedFetch`.

---

## 5. Usage in components, hooks, and stores

### TanStack Query

- **Chats sidebar:** `useQuery` + `getChats` → `mergeChatsFromServer` in Zustand (`chat-sidebar.hook.ts`).
- **Chat page:** `useQuery` for messages and document-by-ids; effects push into `useMessagesStore` / `useChatsStore` (`chat-page.hook.ts`).
- **Documents / scopes pages:** CRUD via `useQuery` + `useMutation` with `invalidateQueries`.
- **Document viewer:** `useQuery` loads blob URL; **good** `URL.revokeObjectURL` on cleanup (`document-viewer-page.hook.ts`).
- **Share chat / upload / create scope:** mutations call API modules directly.

### Imperative / non-Query API usage

- **`submit-chat-message.ts`:** calls `sendMessage` with SSE `onEvent`; updates multiple Zustand stores. **No abort** if user leaves the page mid-stream.
- **`delete-chat.ts`:** calls `deleteChat`, then invalidates/removes queries and clears stores — **consistent** with the hybrid pattern.

### Dead API surface

- **`feedbacks.ts`** is never imported outside itself — API is prepared but **not wired to UI** (missing product feature or leftover spec alignment).

### Minor type hygiene

- `scopes.ts` `createScope` uses a redundant union in the generic (`ScopeDto[] | ScopeDto[]`) — likely a typo; should be `ScopeDto | ScopeDto[]` or similar for clarity.

---

## 6. Findings by severity

### Critical

1. **Hard-coded credentials in `fetchJwtToken`** — Must not ship to production; replace with real auth (form, SSO, or server-issued token without secrets in client source).

### High

2. **Query retry logic incompatible with thrown errors** — `retry()` expects `error.status`; fetch layer does not provide it. Leads to wrong retry behavior and undermines 401 handling at the Query layer.
3. **No request cancellation for SSE `sendMessage`** — Risk of memory/work and state updates after unmount or navigation; users may see inconsistent UI if multiple sends overlap.
4. **`axios` unused** — Bloat, confusion, and false signal for contributors (“which HTTP client?”).

### Medium

5. **Pervasive unchecked JSON casting** — Runtime schema drift or API bugs propagate as silent wrong types; consider Zod (or OpenAPI-generated types + optional validate) at boundaries.
6. **Duplicate state: Query cache vs. Zustand** — Requires discipline on every mutation/delete; easy to desync if a new feature updates only one side.
7. **Generic error messages** — Poor UX for users; no distinction between network, 4xx, 5xx, or validation errors.

### Low / quick wins

8. **Add `.env.example`** with `VITE_API_BASE_URL` and `VITE_AUTH_LOGIN_URL` documented.
9. **Export shared query keys** (e.g. `CHATS_QUERY_KEY` is duplicated in `chat-sidebar.hook.ts` and `delete-chat.ts`) from one module to avoid drift.
10. **Wire or remove `feedbacks.ts`** — Either integrate like/dislike in the message UI or delete until needed.
11. **Fix `createScope` return type** generic in `scopes.ts` for readability.

---

## 7. Prioritized action list

1. **Replace demo login** with a maintainable auth story (no static passwords in repo).
2. **Introduce `HttpError` (or similar)** thrown from `client.ts` / `authorizedFetch` on non-OK, carrying `status` and optional JSON body; align `query-provider` retry with it.
3. **Thread `AbortSignal`** from React Query into fetch options; for `sendMessage`, accept `signal` and abort reader when cancelled.
4. **Remove `axios`** from `package.json` unless you commit to migrating.
5. **Centralize query keys** and document the Query+Zustand pattern (or refactor toward Query-only where possible).
6. **Validate critical responses** (auth, send message final JSON) or generate types from OpenAPI if available.
7. **Implement feedback UI or drop unused API module** to reduce dead code.

---

*End of report.*
