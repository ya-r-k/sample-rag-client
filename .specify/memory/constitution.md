<!--
  Sync Impact Report
  Version change: (initial template) → 1.0.0
  Modified principles: N/A (initial constitution from speckit.constitutionBase)
  Added sections: Base Infrastructure, Authentication, API & Network, Navigation, Localization, Application State, UI & Styling, Technical Stack, Project Architecture
  Removed sections: N/A
  Templates: plan-template.md ✅ (Constitution Check gates added), spec-template.md ✅ (no changes needed), tasks-template.md ✅ (no changes needed)
  Follow-up TODOs: None
-->

# Sample RAG Client Constitution

## Core Principles

### I. Base Infrastructure

Vite v6+ as bundler; TypeScript 5.8+ mandatory. ESLint v9+ with @typescript-eslint v8+, Prettier v3+, and husky pre-commit hooks. React + TypeScript with strict typing — NO `any` allowed. No server-side rendering (SPA only).

### II. Authentication

Access token (JWT) MUST be stored in memory via closure variable or Zustand — never useState, localStorage, or sessionStorage.  
For the current demo implementation, the JWT is obtained directly from the API via `/api/auth/login` and passed to the backend in the `Authorization: Bearer <token>` header.  
The design MUST remain ready to be reconfigured later to use an external OIDC provider without changing the rest of the application.

### III. API & Network

TanStack Query v5.59+ for all requests. Retry logic: do NOT retry 401/403; 3 attempts for other errors. staleTime 5 minutes, refetchOnWindowFocus=false. Offline support via Service Worker, optimistic updates, and skeletons. Streaming via EventSource for SSE.

TanStack Query: `queryFn` MUST not be passed as a direct reference to an API function when that API function expects an optional "filters" object. TanStack Query will call it with `QueryFunctionContext` (`{ client, queryKey, signal }`), which is structurally compatible with optional filter types and can silently break filtering. Always use a wrapper: `queryFn: () => apiFn(filters)` or extract filters from `queryKey`.

### IV. Navigation

React Router v7+ with createBrowserRouter. Smooth URL transitions via Framer Motion v12+ AnimatePresence mode="wait", layoutId for shared element transitions when browser address bar changes.

### V. Localization

react-i18next v15+ with i18next v24+. Lazy-load JSON files per language. Language preference saved in localStorage. ICU formatting and pluralization support.

### VI. Application State

Zustand v5+ with persist middleware for global UI state (active chat, theme, filters, modals). TanStack Query caches server data (messages, users). localStorage for settings (theme, language). idb-keyval ONLY for offline form drafts and unsent messages.

### VII. UI & Styling

Tailwind CSS v3.4+ and SCSS preprocessor with CSS Variables for theming. shadcn/ui for components, Headless UI for primitives, Lucide React for icons. Dark/light/system themes via CSS vars + Zustand store with prefers-color-scheme auto-detection.

Create and edit forms for the same entity MUST be implemented as one reusable component with configurable props for field visibility and validation requirements (required/optional fields).

Any destructive action (delete/remove) MUST require explicit user confirmation before API call or state mutation. Immediate deletion on single click without confirmation is forbidden.

### VIII. License & Dependencies

All dependencies and libraries MUST be free for commercial use (MIT or equivalent). No tests required in this project.

## Technical Stack

**Mandatory packages** (all MIT/free):

- React ^19, React Router ^7
- @tanstack/react-query ^5.59
- zustand ^5
- framer-motion ^12
- react-i18next ^15
- tailwindcss ^3.4, sass
- idb-keyval ^7
- shadcn/ui, headlessui, lucide-react

## Project Architecture

Feature-Sliced Design (FSD). Source structure MUST follow FSD layers: app, pages, widgets, features, entities, shared.

## Governance

Constitution supersedes all other practices. Amendments require documentation, approval, and migration plan. All PRs and reviews MUST verify compliance with principles. Complexity MUST be justified. Use this constitution for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-02-15 | **Last Amended**: 2025-02-15
