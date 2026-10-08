---
name: sample-rag-client-project
description: Project context for SampleRag.Client React SPA with Spec Kit
type: project
---

# Sample RAG Client — Project Context

## Project Overview
- **Type**: React 19 SPA with Vite 7 bundler
- **Purpose**: RAG chat client consuming a separate backend API
- **Architecture**: Feature-Sliced Design (FSD)
- **Key Libraries**: TanStack Query 5.90, Zustand 5, React Router 7, Framer Motion 12, i18next 25, Tailwind CSS 4, shadcn/ui

## Folder Structure (FSD)
```
SampleRag.Client/src/
├── app/              # App shell, providers, routing
├── pages/            # Route pages (chat, documents, scopes, main)
├── widgets/          # Composite UI blocks
├── features/         # Business features (ask-question, upload-document, share-chat)
├── entities/         # Domain entities (chat, scope)
└── shared/           # Truly shared code (api, lib, store, ui)
```

## Build Commands (SampleRag.Client/)
- `npm run dev` — Vite dev server (localhost:5274)
- `npm run build` — tsc && vite build
- `npm run lint` — ESLint 9, max-warnings=0
- `npm run format` — Prettier 3

## Spec Kit Setup
- **Spec Kit Version**: 0.10.2
- **Integration**: Claude Code
- **Workflow**: Full SDD cycle (specify → plan → tasks → implement)
- **Hooks**: Auto-update CLAUDE.md via `speckit.agent-context.update`

## Key Rules (from cursor/.claude/rules/)
1. Extract complex hooks (>2 useEffect or >3 hooks with async/store sync) to `*.hook.ts`
2. Exported components get colocated `*.props.ts`
3. One primary exported component per file
4. Page modals in separate components
5. Combo boxes manage loading internally (not via parent)
6. Multi-line text: contentEditable div with full sync
7. AI tool calls: structured UI, no raw JSON
8. Form submission: Zustand store for payload

## Constitution (MUST Follow)
- Strict TypeScript, no `any`
- JWT in memory only (Zustand/closure)
- TanStack Query: no 401/403 retry, staleTime 5min
- Destructive actions require confirmation
- MIT/free dependencies only
- FSD architecture mandatory

## Custom Commands & Skills
- `/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`
- `/analyze-project`, `/generate-readme`, `/review-external-services-api`, `/review-state-stores`

## Related Memories
- [[MEMORY.md]] — Memory index for project contexts and documentation
