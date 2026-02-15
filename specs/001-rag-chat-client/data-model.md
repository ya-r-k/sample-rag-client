# Data Model: RAG Chat Client

**Feature**: 001-rag-chat-client  
**Date**: 2025-02-15  
**Source**: [spec.md](./spec.md) Key Entities, FR/UX requirements

---

## Entity Overview

The client consumes API responses; it does not own persistence. This document describes the client-side view of entities and their validation rules.

---

## 1. User

Represents a registered user; role determines capabilities.

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| id | string | required, non-empty | Unique identifier |
| username | string | required | Display / login |
| email | string | optional | For sharing by email |
| role | `'regular' \| 'admin'` | required | regular: chat only; admin: + documents |

**Relationships**: Owns chats; has access to shared chats; (if admin) manages documents and groups.

---

## 2. Chat

Represents a conversation; persisted by API.

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| id | string | required, non-empty | Unique identifier |
| name | string | required | System-generated or user-renamed |
| ownerId | string | required | Creator user ID |
| documentGroupId | string | optional | Selected group for this chat |
| isPinned | boolean | default false | Pinned chats in dedicated section |
| folderId | string | optional | User-created folder |
| createdAt | string (ISO 8601) | required | |
| updatedAt | string (ISO 8601) | required | |

**State**: Chat name may be delayed (UX-008: show "New chat" until API returns).

**Relationships**: Has many Message; has many shared users (access list); belongs to ChatFolder (optional).

---

## 3. Message

A single entry in a chat; either user question or system response.

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| id | string | required, non-empty | Unique identifier |
| chatId | string | required | Parent chat |
| role | `'user' \| 'assistant'` | required | |
| content | string | required | Question or answer text |
| citations | Citation[] | optional | Only for assistant messages |
| createdAt | string (ISO 8601) | required | |

**Display order**: Chronological (UX-002).

---

## 4. Citation (Source)

Reference to a document and page; links open document at that page.

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| documentId | string | required | |
| documentName | string | required | Display label (e.g. "Document X") |
| page | number | required | Page number (1-based) |
| url | string | optional | Full URL to open in new tab |

**Rules**: Source links only to internal documents (FR-011); open in new tab/window (FR-002).

---

## 5. Document

PDF file in the system; belongs to a document group.

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| id | string | required, non-empty | |
| name | string | required | Display name |
| groupId | string | required | Document group |
| sizeBytes | number | optional | |
| uploadedAt | string (ISO 8601) | optional | |

**Client validation before upload**: PDF only, max 20MB (FR-015).

---

## 6. Document Group

Collection of documents; users select which group to query.

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| id | string | required, non-empty | |
| name | string | required | |
| documentCount | number | optional | Denormalized |

---

## 7. Chat Folder

User-created container for organizing chats.

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| id | string | required, non-empty | |
| name | string | required | e.g. "Project X", "Personal" |
| userId | string | required | Owner |
| chatIds | string[] | optional | Chats in folder |

---

## 8. Chat Access (Sharing)

Maps users to chats with permissions.

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| chatId | string | required | |
| userId | string | required | |
| role | `'owner' \| 'shared'` | required | Owner cannot be demoted (FR-004) |

---

## Validation Rules Summary

| Rule | Source |
|------|--------|
| PDF only, max 20MB | FR-015, UX-010 |
| Chat name placeholder until API | UX-008 |
| Citations open in new tab | FR-002 |
| Source links internal only | FR-011 |
| Owner cannot be removed | FR-004 |

---

## Client-Side State (Zustand)

Per constitution: Zustand + persist for global UI state.

| Store | Purpose |
|-------|---------|
| activeChatId | Current chat |
| theme | dark/light/system |
| language | ru/en |
| documentGroupFilter | Selected group for queries |
| sidebarCollapsed | UI preference |

---

## Offline Drafts (idb-keyval)

Per constitution: idb-keyval ONLY for offline form drafts and unsent messages.

| Key | Value |
|-----|-------|
| `draft:chat:{chatId}` | Unsent message text |
| `draft:query` | Query input when no chat yet |
