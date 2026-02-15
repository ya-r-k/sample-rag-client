# Implementation Plan: RAG Chat Client

**Branch**: `001-rag-chat-client` | **Date**: 2025-02-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-rag-chat-client/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

RAG chat client with AI-powered Q&A, document management, chat sharing, and admin document upload. React + TypeScript + Vite SPA consuming a local API. Chat UI built with shadcn/ui, Headless UI, Lucide React (constitution-mandated); file upload via react-dropzone; TokenManager for 401 handling and silent refresh via configurable external auth endpoint (access token in memory, refresh token in HttpOnly cookie). All dependencies MIT/Apache-2.0 for commercial use. Restrained color palette via CSS variables.

## Technical Context

**Language/Version**: TypeScript 5.8+, React 19  
**Primary Dependencies**: Vite v6+, TanStack Query v5.59+, Zustand v5, React Router v7, Framer Motion v12, react-i18next v15, Tailwind v3.4+, shadcn/ui, headlessui, lucide-react, react-dropzone  
**Storage**: N/A (client-only; API handles persistence)  
**Testing**: N/A (per constitution: no tests required)  
**Target Platform**: Browser (SPA), modern evergreen browsers  
**Project Type**: Web (frontend only)  
**Performance Goals**: Answer in &lt;30s (SC-001), upload visible in &lt;10s (SC-005), loading visible within 500ms (SC-008)  
**Constraints**: Access token in memory only; refresh token HttpOnly cookie; no localStorage/sessionStorage for tokens; offline support via Service Worker  
**Scale/Scope**: Single frontend app; ~10–15 pages/views; FSD architecture

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md`:

- [x] **Base Infrastructure**: Vite v6+, TypeScript 5.8+, ESLint v9+, Prettier v3+, husky; no `any`; no SSR
- [x] **Authentication**: Access token in memory (closure/Zustand); refresh token HttpOnly cookie; TokenManager with silent refresh
- [x] **API & Network**: TanStack Query v5.59+; retry rules (no 401/403 retry); offline support; SSE via EventSource
- [x] **Navigation**: React Router v7+, Framer Motion v12+ AnimatePresence
- [x] **Localization**: react-i18next v15+, lazy JSON, ICU
- [x] **Application State**: Zustand + persist for UI; TanStack Query for server data; idb-keyval only for offline drafts
- [x] **UI & Styling**: Tailwind v3.4+, SCSS, shadcn/ui, Headless UI, Lucide React; CSS vars theming
- [x] **Architecture**: Feature-Sliced Design (FSD)
- [x] **License**: All dependencies MIT/free for commercial use

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/            # FSD: app layer (providers, router, layout)
├── pages/          # FSD: pages layer (Chat, Documents, Main, etc.)
├── widgets/        # FSD: widgets layer (ChatSidebar, DocumentList, etc.)
├── features/       # FSD: features layer (ask-question, share-chat, upload-document, etc.)
├── entities/       # FSD: entities layer (Chat, Message, Document, User, etc.)
└── shared/         # FSD: shared layer (api, ui, lib, config)
```

**Structure Decision**: Web application (frontend only). FSD layout per constitution. No backend in this repo; client consumes existing local API.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
