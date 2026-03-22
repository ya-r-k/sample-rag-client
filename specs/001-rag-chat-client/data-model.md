# Data Model: RAG Chat Client

**Feature**: 001-rag-chat-client  
**Date**: 2025-02-15  
**Source**: [spec.md](./spec.md), [api-endpoints.md](../../api-endpoints.md)

---

## API Alignment

This data model reflects the **Demo RAG API** (api-endpoints.md). Field names and shapes match the API contract.

---

## Entity Overview

The client consumes API responses; it does not own persistence. Entities below use API field names.

---

## 1. User

Represents a registered user; role from JWT claims.

| Field    | Type                   | Validation | Notes                                          |
| -------- | ---------------------- | ---------- | ---------------------------------------------- |
| id       | string                 | required   | Unique identifier                              |
| username | string                 | required   | Display / login                                |
| role     | `'regular' \| 'admin'` | required   | regular: chat only; admin: + documents, groups |

---

## 2. Scope (Knowledge Group)

API path: `/api/groups`. Collection of documents; users select which scope to query.

| Field | Type   | Validation | Notes |
| ----- | ------ | ---------- | ----- |
| id    | string | required   | GUID  |
| name  | string | required   |       |

---

## 3. Chat

API path: `/api/chats`. Represents a conversation.

| Field    | Type     | Validation | Notes                                          |
| -------- | -------- | ---------- | ---------------------------------------------- |
| id       | string   | required   | GUID                                           |
| title    | string   | required   | System-generated or user-provided              |
| scopeId  | string   | required   | Selected scope for this chat                   |
| ownerIds | string[] | required   | Creator + shared users; caller must be in list |

**Relationships**: Has many Message; ownerIds defines access.

---

## 4. Message

A single entry in a chat; either user question or system response. Created via `POST /api/messages`.

| Field     | Type              | Validation | Notes                      |
| --------- | ----------------- | ---------- | -------------------------- |
| id        | string            | optional   | From API response          |
| chatId    | string            | optional   | When part of existing chat |
| text      | string            | required   | Question or answer text    |
| createdAt | string (ISO 8601) | optional   |                            |

**Display order**: Chronological (UX-002).

---

## 5. Source (Citation)

Reference to a document and page; from RAG response.

| Field      | Type   | Validation | Notes                 |
| ---------- | ------ | ---------- | --------------------- |
| documentId | string | required   | GUID                  |
| pageNumber | number | required   | Page number (1-based) |

**Rules**: Source links only to internal documents (FR-011); open in new tab/window (FR-002).  
**File URL**: `GET /api/files/assets/documents/{fileName}` — client uses `localLink` or document name from upload response to construct URL.

---

## 6. Document

PDF file in the system; belongs to a scope. Response from `POST /api/documents`.

| Field     | Type   | Validation | Notes                                  |
| --------- | ------ | ---------- | -------------------------------------- |
| id        | string | required   |                                        |
| name      | string | required   | Display name                           |
| localLink | string | optional   | Link or filename for download          |
| scopeId   | string | required   | Scope (group) this document belongs to |

**Client validation before upload**: PDF only, max 20MB (FR-015).  
**Upload request**: `scopeId` + file (multipart or base64 `data` + `fileName`).

---

## 7. Feedback

Like/dislike for a message. API path: `/api/messages/{messageId}/feedback`.

| Field     | Type    | Validation | Notes                        |
| --------- | ------- | ---------- | ---------------------------- |
| messageId | string  | required   |                              |
| isLike    | boolean | required   | true = like, false = dislike |

---

## Features Not in API (Client-Side or Deferred)

The following spec features are **not** provided by the current API. Client may implement client-side only or defer:

| Feature                   | Spec Reference | API Support                                     |
| ------------------------- | -------------- | ----------------------------------------------- |
| Chat rename               | FR-009         | No PATCH /chats                                 |
| Pin chats                 | FR-008, UX-005 | No                                              |
| Chat folders              | FR-008         | No                                              |
| Search by chat name       | FR-006         | No (list only, batchSize, lastUsedIndex)        |
| Search by message content | FR-007         | No                                              |
| Revoke chat access        | FR-005         | No explicit revoke; ownerIds is add-only in API |
| List documents            | FR-014         | No GET /documents                               |

---

## Client-Side State (Zustand)

Per constitution: Zustand + persist for global UI state.

| Store            | Purpose                    |
| ---------------- | -------------------------- |
| activeChatId     | Current chat               |
| theme            | dark/light/system          |
| language         | ru/en                      |
| scopeId          | Selected scope for queries |
| sidebarCollapsed | UI preference              |

---

## Offline Drafts (idb-keyval)

Per constitution: idb-keyval ONLY for offline form drafts and unsent messages.

| Key                   | Value                        |
| --------------------- | ---------------------------- |
| `draft:chat:{chatId}` | Unsent message text          |
| `draft:query`         | Query input when no chat yet |
