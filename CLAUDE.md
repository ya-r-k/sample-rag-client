# Sample RAG Client — CLAUDE.md

> Single source of truth for this project. Follow it strictly. All outputs in English.

---

## 1. PROJECT & AGENT SYNC

**Project**: Sample RAG Client — React 19 SPA (Vite + TypeScript) consuming a separate backend API for RAG chat, document upload, and knowledge scope management.

**Tech Stack**: React 19, Vite 7, TypeScript 5.9, TanStack Query 5.90, Zustand 5, React Router 7, Framer Motion 12, i18next 25, Tailwind CSS 4, shadcn/ui, Headless UI, Lucide React, react-dropzone, Ant Design, MUI.

**Architecture**: Feature-Sliced Design (FSD) — layers: `app`, `pages`, `widgets`, `features`, `entities`, `shared`.

```
SampleRag.Client/src/
├── app/              # App shell, providers, routing, global styles
├── pages/            # Route-level compositions (chat, documents, scopes, main)
├── widgets/          # Composite UI blocks (chat, chat-sidebar, footer)
├── features/         # Business features (ask-question, share-chat, upload-document)
├── entities/         # Domain entities (chat, scope) with model + ui
└── shared/           # Truly shared: api, lib (i18n), store, ui primitives
```

**Spec Kit** (`.specify/`): Specification-driven development workflow.  
Constitution: `.specify/memory/constitution.md` — **non-negotiable**; governs all PRs and reviews.  
Templates: `.specify/templates/` (spec, plan, tasks, checklist).  
Agent Context: `.specify/extensions/agent-context/` — auto-updates this file via `speckit.agent-context.update` hook after `/speckit.specify` and `/speckit.plan`.

**Key Files**:
- `CLAUDE.md` — this file (syncs with Spec Kit via markers `<!-- SPECKIT START -->` / `<!-- SPECKIT END -->`)
- `.claude/settings.local.json` — Claude Code permissions/env (OpenRouter gateway)
- `.specify/extensions.yml` — installed extensions + hooks
- `.specify/workflows/speckit/workflow.yml` — Full SDD cycle: specify → review → plan → review → tasks → implement

---

## 2. BUILD, TEST & LINT COMMANDS

Run from `SampleRag.Client/` (the Vite app root).

| Task | Command |
|------|---------|
| **Install deps** | `npm install` |
| **Dev server** | `npm run dev` — Vite on `http://localhost:5274` (strictPort) |
| **Type-check + Build** | `npm run build` — `tsc && vite build` → `dist/` |
| **Lint** | `npm run lint` — ESLint 9 + @typescript-eslint 8, max-warnings=0 |
| **Format** | `npm run format` — Prettier 3 on `src/**/*.{ts,tsx,css,scss}` |
| **Preview build** | `npm run preview` — serves `dist/` |
| **Husky setup** | `npm run prepare` — installs pre-commit hooks |

**No test runner configured** (per Constitution: "No tests required"). If adding tests, use Vitest + React Testing Library.

**Environment**: `VITE_*` vars via `import.meta.env` (no `.env.example` committed). Backend base URL, auth endpoint, etc. must be injected at build/deploy time.

---

## 3. CODE STYLE & ARCHITECTURE RULES

### 3.1 Constitution Principles (Mandatory)

| Area | Rule |
|------|------|
| **Infra** | Vite 6+, TS 5.8+, ESLint 9+, Prettier 3+, Husky. Strict TS — **no `any`**. SPA only (no SSR). |
| **Auth** | JWT in **memory** via Zustand/closure — never `localStorage`/`sessionStorage`/`useState`. Ready for OIDC swap. |
| **API** | TanStack Query 5.59+. Retry: **no retry on 401/403**, 3 attempts otherwise. `staleTime: 5min`, `refetchOnWindowFocus: false`. SSE via `EventSource`. Wrapper pattern: `queryFn: () => apiFn(filters)` — never pass API fn directly. |
| **Navigation** | React Router 7 `createBrowserRouter`. Framer Motion `AnimatePresence mode="wait"` + `layoutId` for shared transitions. |
| **i18n** | `react-i18next` 15+, lazy JSON per language, `localStorage` persistence, ICU pluralization. |
| **State** | **Zustand 5** + persist for UI state (theme, modals, filters, active chat). **TanStack Query** for server cache. `idb-keyval` **only** for offline drafts/unsent messages. |
| **Forms** | All API submission forms **must** use dedicated Zustand store for payload (not local component state). Controlled components bound to store. |
| **UI/Styling** | Tailwind 3.4+ + SCSS + CSS Variables. shadcn/ui + Headless UI + Lucide. Dark/light/system via CSS vars + Zustand. **Reusable create/edit forms** (configurable props). **Destructive actions require explicit confirmation**. **Comboboxes load options internally** (store/query), not via parent props. |
| **Deps** | MIT / free-for-commercial-use only. |

### 3.2 FSD + React Conventions (from `.claude/rules/*.mdc`)

| Rule | Enforcement |
|------|-------------|
| **Single exported component per file** | `features/**/ui/*.tsx`, `pages/**/ui/*.tsx`, `widgets/**/ui/*.tsx`, `entities/**/ui/*.tsx` — one primary component. Internal trivial sugar OK. |
| **Component props in `*.props.ts`** | Exported components → colocated `<Component>.props.ts` exporting the type. Private subcomponents: local `type` OK. |
| **Hook extraction** | If component has **2+ `useEffect`** OR **3+ hooks** (incl. `useTranslation`, `useParams`, `useNavigate`) with async/store sync → **extract to `<Component>.hook.ts`** in same folder. Reused by parent/sibling → `use-<domain>.hook.ts`. Shared across features → `shared/lib/hooks/use<Domain>.ts`. |
| **Page modals** | Modal overlay/dialog markup → separate colocated component. Page keeps state + handlers only. |
| **Combobox options** | Load/manage inside combobox or its dedicated hook/store — never parent-provided arrays. |
| **Multi-line text input** | Use `div contentEditable={true}` + `suppressContentEditableWarning` + `onInput` → `textContent.trim()` + `<br>` normalization. A11y: `role="textbox"`, `aria-label`, `aria-placeholder`, `white-space: pre-wrap`, `max-height` + `overflow-y: auto`. Sync DOM ref on submit/reset. |
| **AI tool calls in UI** | **Never raw JSON** in user-facing chat. Structured presenters: headings, `<dl>`, lists, formatted timestamps, hit cards (doc id + page + snippet). Recursive "friendly value" renderer for unknown tools. |
| **Form state** | API submission payload → dedicated Zustand store (feature or shared). Explicit fields, update actions, reset on success. |

### 3.3 Code Quality

- **ESLint**: `strict: true`, `noUnusedLocals/Parameters: true`, `@typescript-eslint/no-explicit-any: 'warn'`, react-hooks recommended, react-refresh.
- **Prettier**: 3.8+ on TS/TSX/CSS/SCSS.
- **TypeScript**: `strict`, `noEmit`, `isolatedModules`, `bundler` resolution, JSX `react-jsx`.
- **Path aliases**: `@/*` → `src/*` (see `tsconfig.app.json`).

---

## 4. CUSTOM COMMANDS & SKILLS

### 4.1 Spec Kit Slash Commands (`.claude/commands/`, `.cursor/commands/`)

| Command | Purpose | Key Behavior |
|---------|---------|--------------|
| `/speckit.specify` | Create feature spec from description | Branch naming, `[NEEDS CLARIFICATION]` ≤3, quality checklist, user clarification prompts |
| `/speckit.clarify` | Resolve ambiguities in spec | ≤5 targeted questions, multiple-choice + short answer, incremental spec updates, coverage taxonomy |
| `/speckit.plan` | Generate implementation plan | Research phase, data-model, contracts, quickstart, constitution check gates, agent context update |
| `/speckit.tasks` | Generate dependency-ordered `tasks.md` | Phases per user story (P1→P3), parallel markers `[P]`, independent test criteria, MVP scope |
| `/speckit.analyze` | Cross-artifact consistency check (spec/plan/tasks) | **Read-only**. Duplication, ambiguity, underspec, constitution alignment, coverage gaps. Severity: CRITICAL/HIGH/MEDIUM/LOW. |
| `/speckit.implement` | Execute tasks in phases | Follows `tasks.md` phases, validates constitution compliance |
| `/speckit.checklist` | Manage quality checklists | Validate specs/plans against checklist templates |
| `/speckit.constitution` | View/update project constitution | Ratified principles, amendment process |
| `/speckit.taskstoissues` | Convert tasks to GitHub Issues | Bulk create with labels, milestones |
| `/speckit.agent-context.update` | Refresh `CLAUDE.md` Spec Kit section | Auto-hook after `specify`/`plan` (via `.specify/extensions.yml`) |

### 4.2 Utility Commands

| Command | Purpose |
|---------|---------|
| `/analyze-project` | Deep React client analysis → `project.md` (architecture, APIs, patterns, tests, risks, recommendations). Asks for backend context first. |
| `/generate-readme` | Create/update `README.md` (onboarding only — run, env, scripts, layout). Separation from `project.md` enforced. |
| `/review-external-services-api` | Review external API integrations (auth, rate limits, error handling, contracts). |
| `/review-state-stores` | Audit Zustand stores (structure, persistence, hydration, selector patterns). |

### 4.3 Skills (`.claude/skills/`)

| Skill | Description |
|-------|-------------|
| `speckit-analyze` | Consistency analysis across spec/plan/tasks |
| `speckit-clarify` | Ambiguity detection & resolution in spec |
| `speckit-constitution` | Constitution management |
| `speckit-implement` | Phased task execution |
| `speckit-plan` | Technical planning with research gates |
| `speckit-checklist` | Quality checklist validation |
| `speckit-specify` | Feature specification generation |
| `speckit-tasks` | Task decomposition & dependency ordering |
| `speckit-taskstoissues` | GitHub Issues sync |
| `speckit-agent-context-update` | Auto-sync `CLAUDE.md` Spec Kit section |
| `analyze-project` | Deep codebase analysis for `project.md` |
| `generate-readme` | Onboarding README generation |
| `review-external-services-api` | External API review |
| `review-state-stores` | Zustand store audit |

### 4.4 Hooks (`.specify/extensions.yml`)

- **after_specify** → `speckit.agent-context.update` (optional)
- **after_plan** → `speckit.agent-context.update` (optional)

Both prompt before execution (`auto_execute_hooks: true`).

---

## 5. WORKFLOW REFERENCE

### Spec Kit Full Cycle (`.specify/workflows/speckit/workflow.yml`)

```
specify → [review gate] → plan → [review gate] → tasks → implement
```

Each step uses the respective `/speckit.*` command. Review gates require explicit **approve/reject** — reject aborts.

### Feature Branch Naming

`<number>-<short-name>` (e.g., `47-add-bulk-document-upload`).  
Number = highest existing + 1 across remote branches, local branches, `specs/` dirs.

### Spec Quality Checklist (auto-generated at `FEATURE_DIR/checklists/requirements.md`)

Validates: no implementation details, testable requirements, measurable success criteria, no `[NEEDS CLARIFICATION]`, all acceptance scenarios defined, edge cases identified.

---

## 6. QUICK REFERENCE FOR CLAUDE CODE

- **Never** write raw JSON to user-facing UI.
- **Always** extract complex hooks per the 2 `useEffect` / 3 hooks rule.
- **Always** use Zustand for form submission payloads.
- **Always** confirm destructive actions.
- **Always** colocate combobox option loading.
- **Use** `contentEditable` for multi-line inputs (with full sync/normalization).
- **Run** `npm run lint` + `npm run build` before committing.
- **Follow** FSD layer boundaries strictly.
- **Reference** Constitution for any architectural decision.
- **Use** `/speckit.analyze` before `/speckit.implement` to catch spec/plan/task drift.

---

<!-- SPECKIT START -->
<!-- SPECKIT END -->