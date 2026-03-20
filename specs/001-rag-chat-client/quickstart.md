# Quickstart: RAG Chat Client

**Feature**: 001-rag-chat-client  
**Date**: 2025-02-15  
**API Source**: [api-endpoints.md](../../api-endpoints.md)

---

## Prerequisites

- Docker (Docker Engine / Docker Desktop)
- Demo RAG API running (Bearer JWT auth)

---

## Setup (Docker)

```bash
# 1. Перейти в директорию фронтенда
cd SampleRag.Client

# 2. Собрать образ (Node 20 + Vite dev-сервер)
docker build -t sample-rag-client .

# 3. Запустить контейнер с пробросом порта Vite (см. vite.config.ts)
docker run --rm -p 5274:5274 sample-rag-client
```

---

## Environment

| Variable            | Description              | Example                     |
| ------------------- | ------------------------ | --------------------------- |
| `VITE_API_BASE_URL` | Base URL for API         | `http://localhost:3000/api` |
| `VITE_APP_NAME`     | Application display name | `RAG Chat`                  |

---

## Key Directories (FSD)

| Layer    | Path            | Purpose                                   |
| -------- | --------------- | ----------------------------------------- |
| app      | `src/app/`      | Providers, router, layout                 |
| pages    | `src/pages/`    | Route-level pages                         |
| widgets  | `src/widgets/`  | ChatSidebar, DocumentList, etc.           |
| features | `src/features/` | ask-question, share-chat, upload-document |
| entities | `src/entities/` | Chat, Message, Document, User             |
| shared   | `src/shared/`   | api, ui, lib, config                      |

## Auth

API uses **Bearer JWT**; role and identity from claims. Auth endpoints (login, refresh) are not part of this API—obtain token from your auth service and send as `Authorization: Bearer <token>`.

---

## Main Flows (aligned with api-endpoints.md)

### First Message (No Chats / New Chat)

1. User selects scope (group) and enters query
2. `POST /api/messages` with `{ scopeId, text }`
3. Server creates chat with generated title, adds message, runs RAG
4. Response: stream (SSE) or 201 with `{ message, chat, answer, sources }`
5. Redirect to chat page; display answer with sources

### Subsequent Message (Existing Chat)

1. User enters query in chat
2. `POST /api/messages` with `{ chatId, text }`
3. Response: stream or 201 with message + answer + sources

### List Chats

`GET /api/chats?batchSize=&lastUsedIndex=` — returns chats where caller is in ownerIds.

### Create Chat Explicitly

`POST /api/chats` with `{ title, scopeId, ownerIds? }` — if ownerIds omitted, caller is sole owner.

### Share Chat

`POST /api/chats/{id}/owners` with `{ userId }` or `{ userIds: [...] }` — add owner(s).

### Document Upload (Admin)

1. Admin selects PDF (react-dropzone: accept PDF, max 20MB)
2. Client validates; on reject show UX-010 feedback
3. `POST /api/documents` with `scopeId` + file (multipart or base64)
4. Response: document with id, name, localLink, scopeId

### File Download (Citation Links)

`GET /api/files/assets/documents/{fileName}` — use document's `localLink` or name to construct URL. Open in new tab.

### Feedback (Like/Dislike)

`POST /api/messages/{messageId}/feedback` with `{ isLike: true | false }`

---

## API Contract

See [contracts/openapi.yaml](./contracts/openapi.yaml) for full specification (aligned with api-endpoints.md).

---

## Scripts

### Внутри контейнера (CI / локально через Docker)

Базовый образ содержит Node и зависимости, поэтому любые npm-скрипты можно запускать как команду контейнера:

```bash
# Dev-сервер (по умолчанию CMD в Dockerfile)
docker run --rm -p 5274:5274 sample-rag-client

# Production build
docker run --rm sample-rag-client npm run build

# Preview production build (на основе собранного dist)
docker run --rm -p 4173:4173 sample-rag-client npm run preview

# Линтинг
docker run --rm sample-rag-client npm run lint
```

### Опорные npm-скрипты (исполняются ТОЛЬКО внутри контейнера)

| Command           | Purpose                  |
| ----------------- | ------------------------ |
| `npm run dev`     | Start Vite dev server    |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |
| `npm run lint`    | ESLint                   |
| `npm run format`  | Prettier                 |
