# Project deep-dive: Sample RAG Client

## Backend & API context

The browser client talks to a **separate HTTP API** (not shipped in this repository). **Repository name for the server is not specified by the maintainer in this session.**

Evidence in-repo:

- Default base URL **`http://localhost:5234`** (`Dockerfile`, `README.md`, `docker-entrypoint.sh`, `Scripts/docker.run-client.bat`).
- API modules are documented as aligned with a **“Demo RAG API”** style contract (`src/shared/api/*.ts`).
- Streaming payloads for `POST /api/messages` are described as matching a **C# `MessagePartResponse` DTO** (camelCase JSON over SSE); see **POST /api/messages — SSE contract** at the end of this document.

Authentication is **Bearer JWT**: the client obtains a token from **`VITE_AUTH_LOGIN_URL`** (default `…/api/auth/login`) and sends `Authorization: Bearer …` on API calls via `authorizedFetch` (`token-manager.ts`).

---

## Application purpose & client scope

**What it does (short):** A React SPA for **RAG-style chat** over uploaded documents, scoped by **knowledge scopes**, plus **admin-style** pages to manage documents and scopes.

**Main flows:**

- **Home (`/`)** — Landing via `MainPage` inside `AppLayout` (header, footer).
- **Chats (`/chats`, `/chats/:chatId`)** — Two-column layout: `ChatPage` (sidebar + conversation + composer). New threads are created when the user sends a message without a `chatId`; the server may return **`newChatId`** in the SSE stream, after which the client **navigates** to `/chats/:id` (`submit-chat-message.ts`).
- **Documents (`/documents`, `/documents/view`)** — List/upload/edit/delete documents; viewer loads PDF blobs from `/api/files/...`.
- **Scopes (`/scopes`)** — List and create knowledge scopes (`/api/knowledgescopes/...`).
- **`/chat`** — Redirects to `/chats`.

**Role in the system:** Pure **browser client**. It uses **`fetch`** (not axios in `src/`), **`credentials: 'include'`**, JWT in memory (`auth-store`), and **manual SSE parsing** for chat replies. No SSR/RSC.

**Entry and shell:**

- `SampleRag.Client/src/main.tsx` — `ReactDOM.createRoot`, `StrictMode`, `I18nextProvider`, `App`.
- `app/App.tsx` — `QueryProvider` (TanStack Query) + `AppRouter`.
- `app/router.tsx` — `createBrowserRouter`, routes above, `framer-motion` page transitions.

**Notable routing:** No route guards or login UI in code; auth is **implicit dev login** (see weak points).

---

## Project structure

Schematic tree (app code under `SampleRag.Client/src/`, depth ~3):

```
SampleRag.Client/
├── src/
│   ├── app/           # App shell: App, router, layout, QueryProvider, global styles
│   ├── pages/       # Route-level screens: main, chat, documents, scopes
│   ├── widgets/     # Composite UI: chat sidebar, message list, header, footer
│   ├── features/    # User flows: ask-question (composer, scope selector), upload, share-chat
│   ├── entities/    # Thin domain UI/types: chat (e.g. citations), scope types
│   └── shared/      # api/, store/ (Zustand), lib/, ui/ primitives
├── vite.config.ts
├── tsconfig.app.json
└── package.json
```

**Purpose (brief):**

- **`app`** — Wiring only; keeps providers and router out of feature code.
- **`pages`** — Orchestrates widgets/features and hooks (`*.hook.ts`) per screen.
- **`widgets`** — Reusable chat chrome (sidebar, messages, headings).
- **`features`** — Scoped product behavior (query input, document upload, share owners).
- **`entities`** — Small reusable pieces tied to domain concepts.
- **`shared`** — API clients, Zustand stores, i18n, Tailwind-friendly UI primitives.

### Assessment (fit vs. problems)

**Fit:** The layout matches **Feature-Sliced Design**-style boundaries (app → pages → widgets/features → shared). API access is **centralized** under `shared/api`; server cache uses **TanStack Query** where list/detail fetching fits; **Zustand** holds chat message lines and ephemeral stream artifacts—reasonable split for streaming UX.

**Problems:**

- **`shared/store` mixes several domains** (chats, messages, scopes, UI, auth, submission, stream artifacts). It works at current size but can become a **grab-bag** without naming/subfolder discipline.
- **Duplicate DTO shapes** (e.g. `MessageDto` / `ChatDto` in both `messages.ts` and `chats.ts`) risks drift.
- **Dead or unused surface:** `messages-store.finalizeSendResponse` exists but **is not invoked** from `submit-chat-message.ts`; the non-SSE JSON path from `sendMessage` may not reconcile server `message`/`sources` into the store (verify against API behavior).
- **Dependency noise:** `package.json` still lists **Redux Toolkit**, **axios**, and **idb-keyval** with **no imports in `src/`** (verify before removal).

**Conventions:** Colocated hooks as `<component>.hook.ts` (see `.cursor/rules/custom-hooks-fsd.mdc`). ESLint warns on `any` but does not enforce FSD import boundaries via eslint-plugin-boundaries.

---

## Technology stack

| Area | Choice | Notes |
|------|--------|--------|
| Runtime | Node 20 (Dockerfile) | Local dev: match LTS as needed |
| Build | Vite 7, `@vitejs/plugin-react` | Dev server `5274`, `strictPort`, `host: true` |
| Language | TypeScript 5.9, `strict` | `tsconfig.app.json`: `noUnusedLocals`, `noUnusedParameters`, etc. |
| React | 19.x | Client-only |
| Routing | `react-router-dom` 7 | `createBrowserRouter`, `RouterProvider` |
| Server state | TanStack Query 5 | Default `staleTime` 5m, custom `retry` (intended to skip 401/403 if `error.status` exists) |
| Client state | Zustand 5 | Messages, chats list metadata, auth token, stream artifacts, scope selection, etc. |
| HTTP | Native `fetch` | Wrapped by `authorizedFetch` |
| UI | MUI 7, Ant Design 6, Headless UI, Lucide, Tailwind 4 + SCSS | Mixed stack; prefer consolidating over time |
| Motion | Framer Motion 12 | Route transitions |
| i18n | i18next + react-i18next | Initialized under `shared/lib/i18n` |
| Forms / uploads | react-dropzone | Document upload feature |
| Lint / format | ESLint 9 flat config, Prettier (script), Husky `prepare` | No Vitest/Jest in `package.json` |

**TypeScript path aliases:** No `@/` alias in the explored configs; imports use relative paths.

---

## APIs accessed from the client

### Base URL and env

| Variable | Role |
|----------|------|
| `VITE_API_BASE_URL` | Prefix for all API paths (e.g. `http://localhost:5234`) |
| `VITE_AUTH_LOGIN_URL` | POST login; default `…/api/auth/login` |
| `VITE_APP_NAME` | Display string (wired for Docker/env parity) |

**Important:** Values are **embedded at build time** for production builds; Docker dev image injects env at container start. Browsers call the API from the **user’s machine**, so URLs must be reachable from the host (see `README.md` — not Docker internal DNS names for `VITE_*`).

### Endpoints (by module)

| Domain | Module | Typical endpoints |
|--------|--------|-------------------|
| Auth (dev) | `token-manager.ts` | `POST` login URL → raw JWT string |
| Messages | `messages.ts` | `POST /api/messages` (JSON or SSE), `POST /api/messages/filter` |
| Chats | `chats.ts` | `POST /api/chats/filter`, `POST /api/chats`, `POST /api/chats/{id}/owners`, `DELETE /api/chats/{id}` |
| Documents | `documents.ts` | `POST /api/documents/filter`, `POST /api/documents/filter/ids`, `POST /api/documents`, `DELETE /api/documents/{id}`, `GET /api/files/...` (blob) |
| Scopes | `scopes.ts` | `POST /api/knowledgescopes/filter`, `POST /api/knowledgescopes`, user add/remove |
| Feedback | `feedbacks.ts` | `POST /api/feedbacks`, `POST /api/feedbacks/filter` |

### Auth

- Token stored in **`useAuthStore`** (Zustand), **in memory**.
- **`fetchJwtToken`** posts a **fixed JSON body** (demo user fields) to `VITE_AUTH_LOGIN_URL`; response is treated as a **trimmed raw token string** (not a JSON object).
- **`authorizedFetch`**: attaches Bearer header, retries once after `401` with a fresh token.
- **`credentials: 'include'`** on login and API calls (cookies if the API sets them).

### Streaming / cancellation

- SSE: `sendMessage` uses `response.body.getReader()`, decodes lines, parses `data: …` JSON (`messages.ts`).
- **No `AbortSignal`** is threaded from the UI into `sendMessage` in the current flow—long requests cannot be cancelled from the client without closing the page or extending the API.

### Contracts vs. codegen

Types are **hand-written** to mirror the backend. There is **no OpenAPI-generated client** in `src/` (specs may exist under `specs/` for humans).

---

## Patterns & client architecture

### 1. Router + layout composition

- **Where:** `app/router.tsx`, `app/layout.tsx`.
- **Role:** Declarative routes; `AppLayout` wraps non-chat pages with header/footer; chat route uses a **CSS grid** for sidebar + footer placement.
- **Weak spots:** `AnimatePresence` wraps outer motion div but **route elements swap inside `RouterProvider`**—transitions may be limited compared to `useLocation`-keyed outlets.

### 2. TanStack Query for reads and mutations

- **Where:** `chat-page.hook.ts` (messages + document metadata), `chat-sidebar.hook.ts`, `scope-selector.hook.ts`, `documents-page.tsx`, `scopes-page.tsx`, `document-viewer-page.hook.ts`, `share-chat-form.tsx`, `document-upload.tsx`, `create-scope-form.hook.ts`.
- **Role:** Cached lists, `invalidateQueries` after mutations, `enabled` flags tied to route params.
- **Correctness:** `chat-page.hook.ts` syncs query results into **`useMessagesStore`** in `useEffect` (depends on `dataUpdatedAt` to refetch same data). Risk: **dual sources of truth** (React Query cache + Zustand) for messages; acceptable if Zustand is treated as the **UI source** and Query as **fetch**.
- **Query retry:** Default client checks `error.status`; many `throw new Error(\`status ${n}\`)` paths **do not attach `status`**, so **401 might still retry**—worth aligning (custom `ApiError` or `meta`).

### 3. Zustand for chat UX and streaming

- **Where:** `messages-store.ts`, `chats-store.ts`, `stream-artifacts-store.ts`, `auth-store.ts`, `knowledge-scope-store.ts`, `message-submission-store.ts`, `ui-store.ts`.
- **Role:** Optimistic rows, incremental assistant text from SSE, sidebar list, ephemeral “thinking/tool” artifacts.
- **Weak spots:** `submit-chat-message.ts` uses **`getState()`** imperative style—clear for async streams but harder to test than injected deps.

### 4. Imperative submit orchestration

- **Where:** `pages/chat/ui/submit-chat-message.ts`.
- **Role:** Single function coordinates `sendMessage`, navigation on `newChatId`, artifact routing, and store updates.
- **Correctness:** Handles **first SSE frame** creating a chat (`NewChatName` + `newChatId`); starts `stream-artifacts` turn after navigation when needed.

### 5. API thin layer

- **Where:** `shared/api/client.ts` (`apiGet`, `apiPost`, `apiDelete`), domain modules on top.
- **Role:** Consistent `authorizedFetch` and error handling.
- **Weak spots:** Errors are generic `Error` strings—no structured problem details for the UI.

### 6. UI stack fragmentation

- **Where:** MUI/Ant Design/Headless/Tailwind coexist (e.g. layout vs. widgets).
- **Role:** Rapid composition; **cost** is bundle size and inconsistent design tokens.

### Anti-patterns / tech debt signals

- **`console.log` in production paths** (`documents.ts` upload, `scopes.ts` createScope)—should be removed or gated.
- **Hardcoded credentials** in `token-manager.ts` — acceptable only for **local demo**; high risk if ever deployed.

---

## Testing strategy

- **No automated tests** are present in `SampleRag.Client` for this analysis: no `vitest`, `jest`, `playwright`, or `@testing-library/*` in `package.json`, and no `*.test.ts(x)` files were found under `src/`.
- **Implied gap:** SSE parsing (`parseMessagePart`, `parseSSEResponse`), navigation on `newChatId`, and Query↔Zustand sync deserve **unit tests** first (pure functions + store actions).

---

## Test data, mocks, and isolation

- **No MSW** or global fetch mock located in-repo.
- **Manual testing** against a running API is the effective strategy today.

---

## Build, environment & deployment

- **Dev:** `npm run dev` → Vite on **5274**.
- **Production build:** `npm run build` → `tsc && vite build` (output under `dist/` per Vite defaults).
- **Docker:** `Dockerfile` at repo root runs **Vite dev server** inside Node 20 Alpine with `docker-entrypoint.sh` writing `.env` from env vars (development-oriented image, not a static `nginx` production stage in the analyzed file).

---

## Documentation & discoverability

- **`README.md`** — Onboarding, Docker, **`VITE_*`** explanation (host vs container networking).
- **`specs/001-rag-chat-client/`** — Product/spec context; may diverge from implemented stack (already evolved toward Zustand + Query + Tailwind).
- **`project.md` (this file)** — Should be updated when architecture or streaming contract changes (recent work: SSE `MessagePartResponse` alignment per prior implementation notes).

---

## Code quality & maintainability

- **ESLint:** Flat config; recommended TS + React Hooks + Refresh; `@typescript-eslint/no-explicit-any`: **warn**.
- **Prettier:** `npm run format` for `src/**/*.{ts,tsx,css,scss}`.
- **Strict TS** enabled; relative imports are verbose but explicit.
- **Contributor complexity:** **Mid-level** — FSD-ish layout, streaming state, and dual Query/Zustand usage require care; **junior** can still contribute in isolated features with guidance.

---

## Strengths

- Clear **feature-sliced** folder layout and colocated **`*.hook.ts`** pattern.
- **Centralized API** layer with JWT wrapper and documented env vars.
- **Robust SSE handling** aligned with backend enums (`GenerationStep`, `AiTool`), including `role`/`step` normalization and `newChatId` handling.
- **TanStack Query** used for list/load flows with invalidation on mutations.
- **Docker + scripts** document realistic pitfalls (browser-side base URL).
- **Framer Motion** and **i18n** wired at the app shell.

---

## Weak points & risks

- **Security:** Demo **hardcoded login body** and raw token parsing; no real auth UX, session expiry handling, or secret hygiene beyond “dev only.”
- **Dependency bloat / inconsistency:** MUI + Ant Design + Tailwind; unused **Redux**, **axios**, **idb-keyval** in dependencies.
- **Error UX:** Generic thrown errors; little user-facing recovery for failed sends or uploads.
- **Dual message state:** React Query + Zustand for messages can desync if extended carelessly.
- **Submit completion:** `finalizeSendResponse` unused; JSON (non-SSE) `sendMessage` return value may not update UI state.
- **No tests** on the most fragile code (SSE, navigation, stores).
- **Observability:** Stray `console.log` in API modules.
- **Accessibility:** Mixed libraries; composer uses patterns that need consistent a11y (project rules mention `contentEditable` guidance in `.cursor/rules`).

---

## Recommendations

**Quick wins**

1. Remove or replace **`console.log`** in `documents.ts` and `scopes.ts`.
2. Either **wire `finalizeSendResponse`** after `sendMessage` resolves or **delete** dead API if SSE-only is guaranteed.
3. **Drop unused dependencies** after confirming no tooling imports (`redux`, `axios`, `idb-keyval`).
4. Introduce a small **`ApiError`** (status + body) thrown from `apiGet`/`apiPost`/`authorizedFetch` so Query `retry` and UI can branch correctly.

**Medium term**

5. **Consolidate UI stack** (pick Tailwind+Headless OR MUI OR Ant Design for new work).
6. Add **Vitest** tests for `parseMessagePart` / SSE line parsing and **store reducers** (messages + stream artifacts).
7. **AbortController** plumbed from “stop generation” UI into `sendMessage` if the API supports disconnect semantics.
8. Replace hardcoded login with **configurable auth** (env-driven credentials for dev only, or real OIDC) before any shared deployment.

**Larger work**

9. **OpenAPI or zod** schemas shared with backend to prevent DTO drift between `chats.ts` and `messages.ts`.
10. **MSW** or integration tests against a recorded fixture for regression on streaming frames.

---

## POST /api/messages — SSE stream (`MessagePartResponse`)

When the response is `text/event-stream`, **each** SSE `data:` line is one JSON object in **camelCase**, matching the backend `MessagePartResponse` (same fields as the C# DTO).

### `GenerationStep` (numeric)

| Value | Name |
|------:|------|
| 0 | `unknown` |
| 1 | `aiThinking` |
| 2 | `toolUsing` |
| 3 | `toolResult` |
| 4 | `responseMessage` — assistant reply text chunks (`text` appended to the in-flight assistant message) |
| 5 | `newChatName` — `text` is the new chat title |

JSON uses the property **`step`** for this enum. Some payloads may send the same value as **`role`** instead; the client normalizes both to `step` when parsing (`parseMessagePart`).

### `AiTool` (numeric)

| Value | Name |
|------:|------|
| 0 | `unknown` |
| 1 | `currentTime` |
| 2 | `internalDocumentData` |

### Shape (camelCase)

- `text?: string`
- `createdAt?: string` (ISO)
- `step: number` (see `GenerationStep`; or `role` as an alias for `step`)
- `newChatId?: string` (GUID string when the server creates a chat mid-stream)
- `toolsCalls?: { tool: number, arguments?: object }[]`
- `toolsResults?: { tool: number, value?: unknown }[]`

### New thread: first SSE frame

If **no chat** was selected (`chatId` omitted in the request), the **first** event from the API is typically:

```json
{
  "newChatId": "<guid>",
  "text": "<proposed chat title>",
  "role": 5
}
```

Here `role` / `step` **`5`** is `NewChatName` (`GenerationStep`). The client must treat `newChatId` as the real chat id (navigate to `/chats/:id`, bind stream state, seed messages, etc.). Further frames use `step` **`4`** (`ResponseMessage`) for answer deltas and **`1`–`3`** for thinking / tool call / tool result as needed.

Implementation reference: `SampleRag.Client/src/shared/api/messages.ts` (`sendMessage`, `parseSSEResponse`, `parseMessagePart`).
