# Deep analysis: React (client) application codebase

## Purpose and separation of documents

This command produces **`project.md`** only. It must **not** replace or duplicate **`README.md`**.

| Document | Responsibility |
|----------|----------------|
| **`README.md`** | Short, scannable onboarding: what the app is, how to run it locally or in Docker, environment variables, scripts, where specs live, contributing basics. Generated or refined with the **generate-readme** command. |
| **`project.md`** | In-depth technical picture of the **React client**: architecture, data flow, API usage, UI/state patterns, tests, risks, weak points, and **actionable recommendations**. |

If `project.md` already exists, **update it** to match the current codebase. Keep an honest **Weak points & risks** and **Recommendations** tone in `project.md`, not in the README.

---

## Before you start (required prompt to the user)

**Ask the user explicitly** (in your first reply when running this command):

1. **Backend / API context** — Which service(s) does this client talk to? (repo names, base URL conventions, or “same monorepo / unknown”). Record under **Backend & API context**.
2. Optionally: **focus areas** (e.g. performance, a11y, test coverage, bundle size, state management).
3. Optionally: **Areas to scrutinize** — Specific routes, features, or folders (e.g. chat streaming, auth, upload). Use their answer to go deeper there; still cover the tree **holistically**.

Do not invent backends if the user does not answer; state “Not specified by maintainer” and proceed.

---

## Task

Conduct a detailed analysis of the **client-side React application** in the repository (SPA or micro-frontend shell). This is the **browser UI** that consumes HTTP APIs—not the server implementation unless a minimal mock or BFF in-repo is essential to understand the client.

Cover: what the app does for users, **which APIs and contracts it uses**, **technologies and React-centric patterns**, **file/folder structure (fit and critique)**, **testing strategy** (what exists, how tests are organized, doubles/MSW/fixtures), plus weaknesses and improvements.

---

## Analysis structure

### 1. Application purpose and client scope

- **What the app does** in one short paragraph, then slightly more detail from routes and main flows.
- **Role in the system**: how it fits next to the API (JWT, SSE, uploads, etc.) when inferable from code or `VITE_*` / specs.
- **Main entry and app shell**: `main.tsx`, root providers (router, query client, theme, i18n).
- **Notable routes / navigation**: router config, lazy routes, protected routes.
- **Backend & API context** — incorporate the user’s answer from the prompt above.

### 2. Project structure (layout and critique)

- Schematic directory tree (up to ~3 levels) for `src/` and other app-relevant roots.
- Purpose of each major area (1–2 sentences): e.g. Feature-Sliced Design layers (`app`, `pages`, `widgets`, `features`, `entities`, `shared`), or alternative layout.

**Assess whether the structure fits a React client** (not only describe it):

- **Fit**: Clear boundaries between UI composition, domain logic, and API; colocation vs. premature abstraction; shared code that is truly shared.
- **Problems**: “God” folders, unclear feature ownership, API calls scattered vs. centralized, circular imports, test placement that fights the source layout.
- **Conventions**: Comparison to common patterns (FSD, colocated tests, `src/features/*`) where relevant.

Record concrete **recommendations** (moves, splits, boundaries) in **Recommendations** when they would materially help.

### 3. Technology stack (React / front-end)

- **Runtime & toolchain**: Node version if stated, package manager, **Vite** (or CRA/Next if applicable), TypeScript settings that affect the app (`strict`, path aliases).
- **React version** and rendering model (client-only, RSC if any).
- **Routing**: React Router (or equivalent) version and patterns.
- **Server state vs. client state**: TanStack Query / SWR / Redux / Zustand / Context — what is used for what.
- **UI & styling**: component libraries (MUI, Ant Design, etc.), Tailwind, CSS modules, emotion.
- **HTTP & real-time**: `fetch`, axios, native `EventSource` / SSE, WebSockets — where and how.
- **i18n, forms, validation** if present.
- **Key npm dependencies** and why they matter; avoid listing every devDependency unless it shapes quality gates.

### 4. Patterns and client architecture (inventory and judgment)

Identify patterns that **actually appear** in the codebase—not only buzzwords. Examples (when present): **container/presentational**, **custom hooks** as behavior units, **compound components**, **render props**, **lifting state**, **context for theme/locale**, **query key conventions**, **optimistic updates**, **error boundaries**, **suspense** (if used), **lazy + `React.lazy`**, **controlled vs. uncontrolled inputs**, **feature flags**, **RBAC in the router**.

For **each meaningful pattern or cluster**:

- **Where**: paths / modules (brief pointers).
- **Role**: what problem it solves on the client.
- **Correctness**: Hooks rules, stale closures, effect dependencies, query invalidation, memory leaks (subscriptions), accessibility hooks.
- **Placement**: Right layer for FSD or your structure? Could misuse come from blurry boundaries?
- **Alternatives**: Simpler approach? Over-engineering?
- **Weak spots**: Tight coupling, duplicated fetch logic, prop drilling, inconsistent error handling.

Also note **anti-patterns** (e.g. fetching in every leaf component, giant contexts, `useEffect` as sync for derived state) and tie them to **weak points & recommendations**.

### 5. APIs the client accesses

- **Base URL configuration**: `VITE_*` env vars, `import.meta.env`, proxy in `vite.config`.
- **Endpoints or resources** used: group by domain (auth, chats, documents, etc.) with file references under `src/shared/api` or similar.
- **Auth**: how tokens are stored (memory, sessionStorage), refresh or login flow, `Authorization` header wiring.
- **Streaming / long-running**: SSE, chunked responses, cancellation (`AbortSignal`).
- **Generated clients vs. hand-written** types (OpenAPI, zod, etc.) if present.

### 6. Testing strategy

- **Test runner**: Vitest, Jest, or other; where configured.
- **UI tests**: React Testing Library, Enzyme (legacy), component test patterns.
- **E2E**: Playwright, Cypress—folders, how CI runs them if visible.
- **What is asserted**: user-visible behavior, hooks in isolation, API mocks.
- **Coverage or gates**: `vitest.config` coverage, CI workflow steps.

If **no tests** exist, say so explicitly and infer intended approach from docs, scripts, or comments.

### 7. Test data, mocks, and isolation

- **API mocking**: MSW, hand-mocked `fetch`, inline fixtures.
- **Factories / builders**: test helpers, `faker`, static JSON under `__fixtures__` or `mocks/`.
- **Storybook or visual tests** if present.
- **Gaps**: flaky patterns, untested critical paths (auth, streaming, uploads).

### 8. Build, env, and deployment (client)

- **Production build**: `vite build`, output dir, asset handling.
- **Environment variables**: documented `VITE_*` names; never commit secrets; note limitations (everything is public in the bundle).
- **Docker / static hosting** if relevant to this repo.

### 9. Documentation and discoverability

- Alignment of README with actual scripts and ports; presence of `specs/`, OpenAPI, ADRs.
- Whether `project.md` stays in sync after changes.

### 10. Code quality and maintainability

- ESLint / Prettier / TypeScript strictness; path aliases; import boundaries (eslint-plugin-boundaries, etc.).
- Bundle and performance considerations visible in code (lazy routes, large dependencies).
- **Complexity for contributors** (junior/mid/senior) with short justification.

### 11. Strengths, weak points, and recommendations (mandatory)

- **Strengths**: 3–7 bullets.
- **Weak points & risks**: concrete list (API error handling, a11y, test gaps, security in the browser, duplication, tech debt). Include **structure- and pattern-related** risks.
- **Recommendations**: prioritized, actionable (quick wins vs. larger work). This is the main value of `project.md` versus the README.

---

## Output format (`project.md`)

Use Markdown with clear headings, for example:

```markdown
# Project deep-dive: [App name]

## Backend & API context
[User-provided or “Not specified”.]

## Application purpose & client scope
[...]

## Project structure
[Tree + purpose + **assessment**: fit, problems, conventions]

## Technology stack
[React, Vite, TS, key libraries]

## APIs accessed from the client
[Env, modules, auth, streaming]

## Patterns & client architecture
[Inventory + per-cluster: role, correctness, placement, alternatives, weak spots]

## Testing strategy
[...]

## Test data, mocks, and isolation
[...]

## Build, environment & deployment
[...]

## Documentation & discoverability
[...]

## Code quality & maintainability
[...]

## Strengths
[...]

## Weak points & risks
[...]

## Recommendations
[Prioritized list]
```

---

## Additional requirements

- Prefer **evidence from the repo** (paths, `package.json`, configs). If unknown, say so.
- **Patterns**: Reflect what the code **actually** uses; judge quality and fit, not only labels.
- **File structure**: Answer whether it is **sound or problematic** and why.
- Keep **code examples** short (about 5–15 lines).
- **Length**: roughly 2 000–5 000 words; for large apps, prioritize routes/API usage, patterns, structure, and tests.
- **Language**: Write `project.md` in **English** unless the maintainer explicitly asked for another language.
- Do **not** turn this into a second README: skip marketing tone and exhaustive “how to install Node”; those belong in **`README.md`**.

---

**Now analyze this workspace as a React client application and write or update `project.md` accordingly. Begin by asking the user for backend/API context and optionally for focus areas or folders to emphasize.**
