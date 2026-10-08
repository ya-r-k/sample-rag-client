# Review: external services, HTTP APIs, and auth integration

## Output file (mandatory)

Write the full report to **`EXTERNAL_SERVICES_AND_API_REVIEW.md`** in the **repository root** (same directory as `.cursor/` and top-level project files for this workspace; if the app is in a subfolder such as `SampleRag.Client/`, still place **`EXTERNAL_SERVICES_AND_API_REVIEW.md`** at the **workspace root**).

If **`EXTERNAL_SERVICES_AND_API_REVIEW.md`** already exists, **replace it** with an updated audit. Do not use a different filename.

---

## Task

Audit **all logic that reaches outside the browser process**: REST/GraphQL clients, `fetch`/axios wrappers, generated SDKs, SSE/WebSockets, OAuth or token endpoints, refresh flows, header injection, base URL configuration (`import.meta.env`, `VITE_*`), and **mapping raw responses to TypeScript types** (manual casts, Zod/io-ts, OpenAPI types, etc.).

### 1. Inventory

- Map **entry points**: API client modules, `shared/api`, services, BFF calls, auth helpers.
- List **external dependencies** used for HTTP (e.g. axios, ky, openapi-fetch, TanStack Query as transport orchestration).

### 2. Request lifecycle and typing

- **Best practices**: error normalization, timeouts, `AbortSignal`, retries (if any), deduplication, cache boundaries (Query vs. ad hoc `fetch`).
- **Transformation to TS**: where types are trusted vs. validated at runtime; risks of `as` assertions on JSON.
- **Auth**: where tokens are read/stored, header attachment, refresh or 401 handling—**security-relevant** notes (no secrets in client bundle beyond public env).

### 3. Library conflicts and unification

- Detect **multiple HTTP stacks** or overlapping abstractions (e.g. raw `fetch` in one feature, axios in another).
- Propose a **unification strategy**: target client shape, migration order, what to deprecate—be specific to this repo’s layout.

### 4. Usage in UI layer

- How components and **custom hooks** call APIs: centralized hooks vs. scattered `fetch`, Query keys consistency, loading/error states, streaming (SSE) lifecycle.
- Problems: **missing** error handling, duplicated URL building, types disconnected from runtime, hooks that violate composition rules.

### 5. Severity-ranked findings (mandatory)

| Severity | Meaning |
|----------|---------|
| **Critical** | Auth bugs, token leakage patterns, unsafe parsing, broken error handling on money/security paths, CORS misuse documented in code, cancellation missing on unmount for critical flows. |
| **High** | Conflicting HTTP libraries, untyped or unvalidated boundaries, inconsistent base URLs, duplicate auth wiring. |
| **Medium** | Partial migration, inconsistent DTO mapping, missing tests for API layer. |
| **Low / quick wins** | Shared constant extraction, small hook extractions, doc comments. |

---

## Report structure (`EXTERNAL_SERVICES_AND_API_REVIEW.md`)

Use Markdown with at least:

1. Title and **date / commit hint** (if inferable).
2. **Executive summary**.
3. **Inventory** (modules, libraries, env vars).
4. **Request & response handling** (errors, cancellation, validation, typing).
5. **Auth and external identity** (as visible in client code).
6. **Library overlap and unification strategy**.
7. **Usage in components, hooks, and stores** (with paths; issues and fixes).
8. **Findings by severity** (Critical → Low).
9. **Prioritized action list**.

---

## Rules

- Cite **real paths** and short code excerpts (≤ ~15 lines).
- Distinguish **client-visible** constraints (everything in `VITE_*` is public) from server responsibilities when relevant.
- Write in **English** unless the user asked otherwise.
- **Do not** skip writing **`EXTERNAL_SERVICES_AND_API_REVIEW.md`**; the filename is fixed as above.

**Now execute this review for the current workspace and write `EXTERNAL_SERVICES_AND_API_REVIEW.md` at the repository root.**
