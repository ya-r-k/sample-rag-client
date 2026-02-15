# Quickstart: RAG Chat Client

**Feature**: 001-rag-chat-client  
**Date**: 2025-02-15

---

## Prerequisites

- Node.js 20+
- npm or pnpm
- Local RAG API running (see Assumptions in spec)

---

## Setup

```bash
# Clone and install
npm install

# Copy env template (if provided)
cp .env.example .env

# Start dev server
npm run dev
```

---

## Environment

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Base URL for local API | `http://localhost:3000/api` |
| `VITE_APP_NAME` | Application display name | `RAG Chat` |

---

## Key Directories (FSD)

| Layer | Path | Purpose |
|-------|------|---------|
| app | `src/app/` | Providers, router, layout |
| pages | `src/pages/` | Route-level pages |
| widgets | `src/widgets/` | ChatSidebar, DocumentList, etc. |
| features | `src/features/` | ask-question, share-chat, upload-document |
| entities | `src/entities/` | Chat, Message, Document, User |
| shared | `src/shared/` | api, ui, lib, config |

---

## Auth Flow

1. User logs in → `POST /auth/login` (username, password)
2. Backend sets HttpOnly cookie (refresh token) and returns access token
3. Client stores access token in Zustand (memory only)
4. On 401: `POST /auth/refresh` with `credentials: 'include'` → new access token
5. TokenManager retries original request

---

## Main Flows

### First Message (No Chats)

1. User enters query in centered input
2. `POST /chats` with `{ query, documentGroupId }`
3. Redirect to `/chats/:id`
4. Display streaming response; show "New chat" until name arrives

### Subsequent Message

1. User enters query in chat
2. `POST /chats/:id/messages` with `{ query }`
3. Append user message; stream assistant response

### Document Upload (Admin)

1. Admin selects PDF (react-dropzone: accept PDF, max 20MB)
2. Client validates; on reject show UX-010 feedback
3. `POST /documents` multipart/form-data
4. Refresh document list

---

## API Contract

See [contracts/openapi.yaml](./contracts/openapi.yaml) for full API specification.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
