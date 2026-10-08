# Generate or refresh README.md (React client onboarding)

## Role

You are a senior engineer experienced with **React SPAs** (Vite, TypeScript) and conventional open-source READMEs. You write a **short, accurate, scannable** `README.md` that helps someone clone, configure, run, and orient themselves—not a full architecture review or improvement backlog.

---

## Separation from `project.md` (mandatory)

| File | Purpose |
|------|---------|
| **`README.md`** (this command) | **Onboarding only**: what the app is, who it’s for, prerequisites, install, required **environment variables** (`VITE_*`), how to run (dev / build / preview), Docker or scripts if the repo uses them, **brief** project layout pointer, links to specs and to **`project.md`** when deep technical analysis belongs there. |
| **`project.md`** | Deep dive: architecture, API usage details, React patterns, test approach, **risks, weak points, and prioritized recommendations** — produced by the **analyze-project** command. |

**Do not** duplicate `project.md` in the README. Include **at most one line** such as: “For a detailed technical overview, API/pattern notes, and improvement suggestions, see [`project.md`](project.md).” (Only if `project.md` exists or the team plans to maintain it.)

**Do not** put in the README: long pattern catalogs, weak-point registers, prioritized technical debt backlogs, or detailed test-strategy write-ups.

---

## Task

1. Inspect the repository (root layout, `package.json` / app folder, Vite config, Docker, `specs/` if present).
2. Create or update **`README.md`** with the sections below, tuned for a **React + Vite (or similar) front-end client** that talks to a **separate backend** unless this repo is full-stack.

---

## Required README sections

Use GitHub-flavored Markdown. **One H1**: project title.

1. **Title and one-line description** — What the client does in plain language.
2. **What it does** — Few bullets: main user-facing capabilities (chat, admin, etc.). **No** deep stack justification; a single line listing primary tech (e.g. React, Vite, TypeScript) is enough.
3. **Requirements** — Node version, browser assumptions if non-standard; note if an external API must be running.
4. **Getting started** — `cd` into the app directory, `npm install` / `pnpm install`, copy **`.env.example`** or document required `VITE_*` variables with a minimal example block.
5. **Run scripts** — Table or list: `dev`, `build`, `preview`, `lint`, `format`, test command if it exists (name the script; **do not** explain testing philosophy here).
6. **Optional: Docker / CI scripts** — Only what exists in the repo; keep steps copy-paste friendly.
7. **Project layout (high level)** — Small tree or bullet list: where `src/`, router, API layer live—**one screen max**.
8. **Documentation & help** — Relative links to `specs/`, OpenAPI, **`project.md`** (see separation above), `CONTRIBUTING.md` if present.
9. **Contributing** — Short paragraph; PR expectations (lint/format) if obvious from the repo.
10. **License** — One line + link to `LICENSE` if the file exists; otherwise state that terms are TBD.

Optional, when accurate and concise:

- Badges (Node, React, CI) if versions or URLs are clear from the repo.
- Default dev URL and port (from `vite.config` or docs).

---

## Guidelines

- **Audience**: Developers who need to **run and ship the client**, not study every pattern.
- **Tone**: Direct and practical; minimal marketing.
- **Links**: Prefer **relative** links for in-repo files.
- **Size**: Skimmable on one scroll on GitHub; avoid duplicating full spec text.

### What NOT to include in README.md

- Architectural critique, pattern inventories, or “alternatives considered” → **`project.md`**
- Assessment of weak points, risks, or prioritized refactors → **`project.md`**
- Detailed description of test doubles, MSW setup, or coverage analysis → **`project.md`**
- Full API reference → point to OpenAPI or `specs/`; README stays overview + env + run

---

## After generating

- Ensure commands, ports, and env var names match **actual** `vite.config`, `package.json`, and Docker files.
- If the app lives in a subfolder (e.g. `SampleRag.Client/`), state the correct `cd` path in every command example.

**Now create or update `README.md` for this repository according to the above, without overlapping the responsibilities of `project.md`.**
