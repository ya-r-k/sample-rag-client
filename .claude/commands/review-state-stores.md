# Review: global and feature state stores

## Output file (mandatory)

Write the full report to **`STATE_STORES_REVIEW.md`** in the **repository root** (same directory as `.cursor/`, `package.json`, or the monorepo client root you are analyzing—use the workspace root if the app lives in a subfolder like `SampleRag.Client/`, still place **`STATE_STORES_REVIEW.md`** at the **workspace / repo root** the user opened).

If **`STATE_STORES_REVIEW.md`** already exists, **replace it** with an updated audit based on the current codebase. Do not use a different filename.

---

## Task

Perform a structured review of **all state stores** in this project (e.g. Zustand, Redux, Jotai, Valtio, Pinia if any, or custom store patterns). Include anything that acts as a **centralized mutable client state container** under names like `*store*`, `use*Store`, or module-level singleton state used like a store.

### 1. Inventory

- List every store module with **file paths**.
- For each: library/API used, purpose (domain), approximate surface (selectors, actions, persistence, middleware).

### 2. Best practices and consistency

- **Single library**: Confirm whether one state library is used project-wide. If multiple exist, explain **why that might be a problem** and whether usage is justified (legacy vs. new code).
- **Unification**: Patterns for naming, file placement (e.g. `shared/store`, feature-local stores), TypeScript typing, immutability updates, devtools, subscriptions.
- **Per-store judgment**: Correct use of the chosen API (e.g. Zustand shallow compare, slices, `subscribeWithSelector`), avoidable footguns (stale closures, storing non-serializable values without reason).

### 3. Overlap and refactoring

- Identify **duplicated or overlapping concerns** (e.g. two stores both holding “current chat”, UI flags vs. server cache duplication).
- Suggest **concrete refactors**: merge, split, extract shared primitives, move ownership to TanStack Query / server state where appropriate—tie suggestions to **paths and names**.

### 4. Usage in components and hooks

- Sample **how** stores are consumed: direct `useStore` in leaves vs. thin selectors, custom hooks as facades, tests.
- Flag **misuse**: over-subscription (re-renders), business logic inside components that belongs in store actions, bypassing established hooks, circular dependencies.

### 5. Severity-ranked findings (mandatory)

Group issues so maintainers can triage:

| Severity | Meaning |
|----------|---------|
| **Critical** | Data races, incorrect shared state, security-sensitive state mishandled, patterns that break React rules or cause obvious bugs. |
| **High** | Inconsistent libraries or patterns blocking maintainability, major overlap/duplication, clear performance traps. |
| **Medium** | Naming/placement drift, partial unification, missing types or tests for stores. |
| **Low / quick wins** | Small renames, documentation, trivial extractions. |

Within each severity, order items by **impact** or **ease of fix** when helpful.

---

## Report structure (`STATE_STORES_REVIEW.md`)

Use Markdown with at least:

1. Title and **date / commit hint** (if inferable).
2. **Executive summary** (short).
3. **Store inventory** (table or list with paths).
4. **Library and pattern consistency** (single vs. multiple libraries, conventions).
5. **Best-practice assessment** (per cluster or per store when few).
6. **Overlaps and refactoring suggestions**.
7. **Usage in components & hooks** (examples with paths; problems and fixes).
8. **Findings by severity** (Critical → Low), each with **recommended fix**.
9. **Recommended next steps** (prioritized checklist).

---

## Rules

- Ground conclusions in **repository evidence** (paths, snippets ≤ ~15 lines).
- If no dedicated stores exist, say so and describe **what holds equivalent state** (Context, Query cache only, etc.) and whether that is appropriate.
- Write the report in **English** unless the user asked otherwise.
- **Do not** skip writing **`STATE_STORES_REVIEW.md`**; the filename is fixed as above.

**Now execute this review for the current workspace and write `STATE_STORES_REVIEW.md` at the repository root.**
