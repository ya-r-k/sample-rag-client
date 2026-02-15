# Tasks: RAG Chat Client

**Input**: Design documents from `/specs/001-rag-chat-client/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not required (per constitution).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (frontend only)**: `src/` with FSD layers (app, pages, widgets, features, entities, shared)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create Vite + React + TypeScript project with `npm create vite@latest . -- --template react-ts` in `d:\concepts\rag-projects\sample-rag\sample-rag-client`
- [ ] T002 [P] Configure ESLint v9+ and Prettier v3+ in `eslint.config.js` and `.prettierrc`
- [ ] T003 [P] Configure husky pre-commit hooks in `.husky/`
- [ ] T004 Create FSD structure: `src/app/`, `src/pages/`, `src/widgets/`, `src/features/`, `src/entities/`, `src/shared/` per plan.md
- [ ] T005 Install dependencies: @tanstack/react-query ^5.59, zustand ^5, react-router-dom ^7, framer-motion ^12, react-i18next ^15, tailwindcss ^3.4, sass, idb-keyval ^7, react-dropzone, @headlessui/react, lucide-react
- [ ] T006 Initialize shadcn/ui and add base components (Button, Input, ScrollArea); add Lucide React icons in `src/shared/ui/`
- [ ] T007 Configure Tailwind CSS and SCSS with CSS variables for theming in `tailwind.config.js` and `src/app/styles/`
- [ ] T008 Add environment config: `VITE_API_BASE_URL`, `VITE_APP_NAME`, `VITE_AUTH_REFRESH_URL` in `.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Create API client with Bearer JWT auth in `src/shared/api/client.ts` (fetch wrapper, Authorization header from token)
- [ ] T010 Create auth store (Zustand) for access token in memory in `src/shared/api/auth-store.ts`
- [ ] T011 Implement TokenManager: on 401, call configurable refresh endpoint (VITE_AUTH_REFRESH_URL) with credentials:include; store new token; retry request; on refresh failure, clear token (constitution II)
- [ ] T012 Configure TanStack Query with retry rules (no 401/403 retry), staleTime 5min, refetchOnWindowFocus=false in `src/app/providers/query-provider.tsx`
- [ ] T013 Setup React Router v7 with createBrowserRouter in `src/app/router.tsx`
- [ ] T014 Setup react-i18next with lazy JSON for ru/en in `src/shared/lib/i18n/`
- [ ] T015 Create base layout (header placeholder, footer placeholder, outlet) in `src/app/layout.tsx`
- [ ] T016 Create Zustand UI store (theme, language, sidebarCollapsed) with persist in `src/shared/store/ui-store.ts`
- [ ] T017 Add Framer Motion AnimatePresence for page transitions in `src/app/`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Ask Question and Get Answer with Sources (Priority: P1) 🎯 MVP

**Goal**: User selects scope, enters question, submits; receives AI answer with source citations; clicks source to open document at page.

**Independent Test**: User submits question, receives answer with clickable sources; clicking source opens document at correct page.

### Implementation for User Story 1

- [ ] T018 [P] [US1] Create Scope and Source types in `src/entities/scope/model/types.ts`
- [ ] T019 [P] [US1] Create Message and Chat types in `src/entities/chat/model/types.ts`
- [ ] T020 [US1] Implement GET /api/groups in `src/shared/api/groups.ts`
- [ ] T021 [US1] Implement POST /api/messages (scopeId+text, chatId+text) with SSE support in `src/shared/api/messages.ts`
- [ ] T022 [US1] Create scope selector component in `src/features/ask-question/ui/scope-selector.tsx`
- [ ] T023 [US1] Create query input component in `src/features/ask-question/ui/query-input.tsx`
- [ ] T024 [US1] Create message list with user/assistant bubbles and citation links in `src/widgets/chat/ui/message-list.tsx`
- [ ] T025 [US1] Create citation link component (opens GET /api/files/assets/documents/{fileName} in new tab) in `src/entities/chat/ui/citation-link.tsx`
- [ ] T026 [US1] Create chat page with message list, query input, scope selector in `src/pages/chat/ui/chat-page.tsx`
- [ ] T027 [US1] Wire chat page to POST /api/messages; handle streaming or 201 response; display answer and sources
- [ ] T028 [US1] Add loading spinner during message submission (UX-007, SC-008)

**Checkpoint**: User Story 1 complete — Q&A with sources works

---

## Phase 4: User Story 2 - Chat Persistence and History (Priority: P2)

**Goal**: User views list of past chats; opens chat to see full message history (questions and answers with sources).

**Independent Test**: User creates chat, leaves, returns; sees chat in list with all messages intact.

### Implementation for User Story 2

- [ ] T029 [US2] Implement GET /api/chats (batchSize, lastUsedIndex) in `src/shared/api/chats.ts`
- [ ] T030 [US2] Implement GET /api/chats/{id} in `src/shared/api/chats.ts`
- [ ] T031 [US2] Create chat list item component in `src/widgets/chat-sidebar/ui/chat-list-item.tsx`
- [ ] T032 [US2] Create chat sidebar with list of chats in `src/widgets/chat-sidebar/ui/chat-sidebar.tsx`
- [ ] T033 [US2] Add chat history fetching: GET /api/chats/{id} returns chat; if response includes `messages` array (see contracts), display it; else accumulate messages from POST /api/messages responses cached in TanStack Query
- [ ] T034 [US2] Integrate chat sidebar into chat page layout; select chat loads messages

**Checkpoint**: User Stories 1 and 2 work — chat list and history visible

---

## Phase 5: User Story 3 - First Message Flow (No Chats Yet) (Priority: P3)

**Goal**: When user has no chats, query input is primary focus; on submit, redirect to new chat page; show response with system-generated title.

**Independent Test**: User with zero chats enters question, submits; taken to new chat with response and title.

### Implementation for User Story 3

- [ ] T035 [US3] Create empty-state chat page (query input centered, no sidebar) in `src/pages/chat/ui/empty-chat-page.tsx`
- [ ] T036 [US3] On POST /api/messages with scopeId+text, redirect to /chats/{chatId} when response includes chat
- [ ] T037 [US3] Display placeholder "New chat" until API returns chat title (UX-008)
- [ ] T038 [US3] Route logic: show empty-chat-page when no chats; show chat-page when chat selected or after first message

**Checkpoint**: First-message flow works for new users

---

## Phase 6: User Story 4 - Chat Management (Priority: P4)

**Goal**: Share chat (add owner), delete chat (owner only). Note: API does not support revoke, search, pin, folders, rename.

### Implementation for User Story 4

- [ ] T039 [US4] Implement POST /api/chats/{id}/owners in `src/shared/api/chats.ts`
- [ ] T040 [US4] Implement DELETE /api/chats/{id} in `src/shared/api/chats.ts`
- [ ] T041 [US4] Create share chat feature (enter userId/username/email, call add-owners) in `src/features/share-chat/`
- [ ] T042 [US4] Create delete chat action in chat header/sidebar; confirm before delete
- [ ] T043 [US4] Client-side search: filter chat list by title (FR-006, client-side only per API Alignment)

**Checkpoint**: Share and delete work; search is client-side filter

---

## Phase 7: User Story 5 - Document Availability Indicator (Priority: P5)

**Goal**: When no documents in system or selected scope, show explicit "chat unavailable" message; disable query submit.

**Independent Test**: No documents → message shown, submit disabled; documents added → chat available.

### Implementation for User Story 5

- [ ] T044 [US5] Determine document availability: if API provides scope document count, use it; else infer from empty RAG response or add GET /api/groups/{id} with count
- [ ] T045 [US5] Create unavailable message component (UX-006) in `src/features/ask-question/ui/chat-unavailable.tsx`
- [ ] T046 [US5] Disable query input when no documents; show unavailable message
- [ ] T047 [US5] Show unavailable per-scope when scope has no documents (if API supports)

**Checkpoint**: Unavailable state clearly indicated

---

## Phase 8: User Story 6 - Admin Document Management (Priority: P6)

**Goal**: Admin creates scopes, uploads PDFs (scopeId, max 20MB), sees upload success. Client validates PDF/20MB before submit.

**Independent Test**: Admin creates scope, uploads valid PDF; invalid file rejected before submit.

### Implementation for User Story 6

- [ ] T048 [US6] Implement POST /api/groups in `src/shared/api/groups.ts`
- [ ] T049 [US6] Implement POST /api/documents (scopeId + multipart file) in `src/shared/api/documents.ts`
- [ ] T050 [US6] Create document upload with react-dropzone (accept PDF, maxSize 20MB, onDropRejected) in `src/features/upload-document/ui/document-upload.tsx`
- [ ] T051 [US6] Add invalid file feedback (UX-010) before any server request
- [ ] T052 [US6] Create scope creation form in `src/features/upload-document/ui/create-scope-form.tsx`
- [ ] T053 [US6] Create documents admin page (create scope, upload) in `src/pages/documents/ui/documents-page.tsx`
- [ ] T054 [US6] Gate documents page by role (admin only); hide from regular users (FR-017, User Story 6 AC6)
- [ ] T055 [US6] Document list: API has no GET /documents; show uploaded docs from local state or defer; add note in UI if empty

**Checkpoint**: Admin can create scopes and upload PDFs

---

## Phase 9: User Story 7 - Main Page, Navigation, and UX (Priority: P7)

**Goal**: Main page with nav (chat, documents for admin); header (nav, user menu, language); footer; smooth transitions; i18n ru/en.

**Independent Test**: Navigate between pages; smooth transitions; language switch; loading spinners.

### Implementation for User Story 7

- [ ] T056 [US7] Create main page with navigation links in `src/pages/main/ui/main-page.tsx`
- [ ] T057 [US7] Add header with nav links, user menu, language selector (UX-014) in `src/widgets/header/ui/header.tsx`
- [ ] T058 [US7] Add footer with copyright, version (UX-015) in `src/widgets/footer/ui/footer.tsx`
- [ ] T059 [US7] Add i18n translations for ru/en (all user-facing strings per UX-012) in `src/shared/lib/i18n/locales/`
- [ ] T060 [US7] Apply Framer Motion AnimatePresence for page transitions (UX-013)
- [ ] T061 [US7] Ensure loading spinners for all async operations (FR-019)
- [ ] T062 [US7] Apply restrained color palette via CSS variables (research.md)
- [ ] T063 [US7] Add keyboard focus states (UX-011)

**Checkpoint**: Full navigation and UX polish

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements across all stories

- [ ] T064 [P] Add error boundary and API error display (UX-007 retry affordance)
- [ ] T065 [P] Add offline support placeholder (idb-keyval for drafts per constitution)
- [ ] T066 Run quickstart validation: npm run dev, npm run build, npm run lint
- [ ] T067 Code cleanup: remove any `any`, ensure strict TypeScript

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3+ (User Stories)**: All depend on Phase 2
- **Phase 10 (Polish)**: Depends on all desired user stories

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no other story dependency
- **US2 (P2)**: After Phase 2 — extends US1 (chat page)
- **US3 (P3)**: After Phase 2 — extends US1/US2 (first-message flow)
- **US4 (P4)**: After Phase 2 — extends US2 (chat list/sidebar)
- **US5 (P5)**: After Phase 2 — extends US1 (scope selector, query)
- **US6 (P6)**: After Phase 2 — independent (admin pages)
- **US7 (P7)**: After Phase 2 — wraps all (layout, nav)

### Parallel Opportunities

- T002, T003, T006, T007 can run in parallel (Phase 1)
- T009, T010, T011 can run in parallel (Phase 2)
- T018, T019 can run in parallel (Phase 3)
- After Phase 2: US6 (admin) can proceed in parallel with US1–US5

---

## Parallel Example: User Story 1

```bash
# Models in parallel:
T018: "Create Scope and Source types in src/entities/scope/model/types.ts"
T019: "Create Message and Chat types in src/entities/chat/model/types.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Submit question, get answer with sources, click source link
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → MVP (Q&A with sources)
3. Add US2 → Chat list and history
4. Add US3 → First-message flow
5. Add US4 → Share, delete
6. Add US5 → Unavailable indicator
7. Add US6 → Admin upload
8. Add US7 → Navigation, i18n, polish

---

## Notes

- API has no GET /documents; document list (FR-014) may show only recently uploaded (local state) or display "No list API" until backend adds it
- Pin, folders, rename, revoke, search-by-content: client-side only or deferred per API Alignment
- Auth: Bearer JWT; TokenManager (T011) calls configurable refresh endpoint on 401
