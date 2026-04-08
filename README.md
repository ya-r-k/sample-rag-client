# Sample RAG Client

![Node.js](https://img.shields.io/badge/node-%3E%3D20-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/react-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/vite-7-646cff?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-5-3178c6?logo=typescript&logoColor=white)

Web client for a **Retrieval-Augmented Generation (RAG)** workflow: scoped document groups, AI chat with citations, document management, and admin flows. It talks to a separate backend API over HTTP (Bearer JWT).

---

## What this project does

- **Chat**: Ask questions against a selected knowledge scope; view streamed or full responses with **source citations** that can open documents in a new tab.
- **Chats & history**: Browse chats, open threads, and continue conversations (`/chats`, `/chats/:chatId`).
- **Documents & scopes (admin)**: Manage documents and knowledge scopes (`/documents`, `/scopes`).
- **i18n**: English and Russian UI strings (`src/shared/lib/i18n/`).

The UI is built with **React 19**, **Vite 7**, **TanStack Query**, **Zustand**, **Ant Design**, **MUI**, **Tailwind CSS 4**, and **Feature-Sliced Design** (`app` → `pages` → `widgets` → `features` → `entities` → `shared`).

---

## Why it is useful

| Benefit | Details |
|--------|---------|
| **Focused UX** | Flows aligned with RAG APIs: scopes, messages, chats, files, feedback. |
| **Type-safe API layer** | Typed clients under `src/shared/api/` with shared `authorizedFetch`. |
| **Fast local dev** | Vite HMR, ESLint 9, Prettier, optional Husky pre-commit in `SampleRag.Client`. |
| **Docker-ready** | Root `Dockerfile` runs the Vite dev server with configurable `VITE_*` env vars. |

---

## Getting started

### Step-by-step: run everything in Docker (Windows)

Use this path if you want **API + dependencies + client** without installing Node.js locally.

1. **Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)** for Windows and keep it running.

2. **Place the two repositories side by side** under the same parent folder. The batch script looks for the API here: `..\..\semantic-kernel-sample-rag-api\Scripts\docker.run-api.bat` relative to `Scripts\`, i.e. next to `sample-rag-client`:

   ```text
   <parent-folder>/
   ├── sample-rag-client/          ← this repo (clone here)
   └── semantic-kernel-sample-rag-api/
       └── Scripts/
           └── docker.run-api.bat    ← must exist
   ```

3. **Open the client script** from Explorer or from `cmd` / PowerShell:

   ```bat
   cd path\to\sample-rag-client\Scripts
   docker.run-client.bat
   ```

   Or double-click `Scripts\docker.run-client.bat`.

4. **Wait for the script to finish** the API part first (`docker.run-api.bat` may pull images, start MongoDB, Qdrant, Ollama, build/run the API — the first run can take a long time). Then the client image is built and container `sampleragclient` is started or resumed.

5. **Open the app in the browser**: **[http://localhost:5274](http://localhost:5274)**  
   API (for checks): **[http://localhost:5234](http://localhost:5234)**  
   The script prints the same URLs at the end. It may stop on **“Press Enter to continue…”** — press Enter to close the window; containers keep running.

6. **If you changed the Dockerfile, `docker-entrypoint.sh`, or need new `VITE_*` values**, remove the old client container and run the script again so a new container is created:

   ```bat
   docker rm -f sampleragclient
   ```

   Then run `docker.run-client.bat` again (it will run `docker run` with fresh env).

#### What `Scripts/docker.run-client.bat` does

| Step | Action |
|------|--------|
| 1 | Verifies that `semantic-kernel-sample-rag-api\Scripts\docker.run-api.bat` exists; exits with an error if not. |
| 2 | **`call docker.run-api.bat --no-pause`** from that folder — starts stack dependencies and the Sample RAG API container (same as developing the API in Docker). |
| 3 | Switches to the **client repo root** (`sample-rag-client`). |
| 4 | Ensures Docker network **`samplerag-net`** exists and attaches **`sampleragapi`** to it (if needed). |
| 5 | **`docker build -t sampleragclient -f Dockerfile .`** — builds the React/Vite dev image. |
| 6 | If a container named **`sampleragclient`** already exists → **`docker start`**; otherwise **`docker run`** with `-p 5274:5274`, network `samplerag-net`, and **`VITE_*` env vars** pointing at **`http://localhost:5234`** (the browser runs on your PC, so use `localhost`, not the API container name). |

Helper: **`Scripts/npm.format-codebase.bat`** — only formats the client with Prettier (`npm run format` inside `SampleRag.Client`); it does not start Docker.

---

### Prerequisites (local development without Docker)

- **Node.js 20+** and npm.
- A running **Sample RAG API** (or compatible backend), e.g. from `semantic-kernel-sample-rag-api`.

### Install and run (local, without Docker)

```bash
cd SampleRag.Client
npm install
```

Create a `.env` file in `SampleRag.Client` (Vite only exposes variables prefixed with `VITE_`):

```env
# Base URL of the API (no trailing slash). Paths like /api/chats are appended in code.
VITE_API_BASE_URL=http://localhost:5234
VITE_AUTH_LOGIN_URL=http://localhost:5234/api/auth/login
VITE_APP_NAME=Sample RAG Client
```

```bash
npm run dev
```

Open **http://localhost:5274** (see `SampleRag.Client/vite.config.ts`).

### Common npm scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier on `src/**/*.{ts,tsx,css,scss}` |

### Docker without the Windows script (Linux / macOS / manual)

Build from the **client repository root** (folder that contains `Dockerfile` and `SampleRag.Client/`):

```bash
docker build -t sampleragclient -f Dockerfile .
docker run --rm -p 5274:5274 \
  -e VITE_API_BASE_URL=http://localhost:5234 \
  -e VITE_AUTH_LOGIN_URL=http://localhost:5234/api/auth/login \
  -e "VITE_APP_NAME=Sample RAG Client" \
  sampleragclient
```

You must **start the API and dependencies yourself** (or reuse the API repo’s scripts) so something listens on **port 5234** on the host.

**Important:** use **`http://localhost:<api-port>`** in `VITE_*` — requests are made from **your browser**, not from inside the client container, so Docker service names like `sampleragapi` will not work for those variables.

### Project layout

```text
sample-rag-client/
├── Dockerfile                 # Node 20 + Vite dev, entrypoint writes .env from env vars
├── docker-entrypoint.sh
├── Scripts/                   # Windows convenience scripts
├── SampleRag.Client/          # React application (primary codebase)
│   ├── src/
│   │   ├── app/               # Router, layout, providers
│   │   ├── pages/             # Route pages
│   │   ├── widgets/           # Composite UI (e.g. chat sidebar)
│   │   ├── features/          # User scenarios (ask, upload, share)
│   │   ├── entities/          # Domain-oriented UI/types
│   │   └── shared/            # api, ui, lib, store
│   └── vite.config.ts
└── specs/001-rag-chat-client/ # Feature spec, contracts, quickstart notes
```

---

## Where to get help

| Resource | Description |
|----------|-------------|
| [project.md](project.md) | Technical deep-dive: architecture, client patterns, tests, risks, and improvement recommendations (not onboarding) |
| [specs/001-rag-chat-client/quickstart.md](specs/001-rag-chat-client/quickstart.md) | Feature quickstart and directory map |
| [specs/001-rag-chat-client/spec.md](specs/001-rag-chat-client/spec.md) | Product specification and user stories |
| [specs/001-rag-chat-client/contracts/api-endpoints.md](specs/001-rag-chat-client/contracts/api-endpoints.md) | HTTP contract overview |
| [specs/001-rag-chat-client/contracts/openapi.yaml](specs/001-rag-chat-client/contracts/openapi.yaml) | OpenAPI description |
| [SampleRag.Client/README.md](SampleRag.Client/README.md) | Client package notes (if present) |
| [SampleRag.Client/CHANGELOG.md](SampleRag.Client/CHANGELOG.md) | Client changelog |

Use your host’s **issue tracker** (for example GitHub Issues) for bugs and feature requests once the repository is published.

---

## Maintainers and contributing

This project is maintained by **whoever owns this repository**. Contributions are welcome via **issues and pull requests**.

Before submitting a PR:

- Run `npm run lint` and `npm run format` from `SampleRag.Client`.
- Keep API env vars documented when adding new `VITE_*` usage.

If the repository later adds a **`CONTRIBUTING.md`**, use that for detailed process; until then, follow existing code style (ESLint + Prettier, FSD-style folders).

---

## License

License terms are not defined in this repository root yet. When a **`LICENSE`** file is added, refer to it for redistribution and use.
