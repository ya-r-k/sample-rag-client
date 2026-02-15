# Research: RAG Chat Client

**Feature**: 001-rag-chat-client  
**Date**: 2025-02-15  
**Purpose**: Resolve technical unknowns and select libraries per user requirements (extensible, secure, free for commercial use, internal token service).

---

## 1. Chat / Message UI Libraries

### Decision

**Use shadcn/ui + custom components** — no third-party chat library.

### Rationale

- **Constitution mandate**: shadcn/ui is required for components; Headless UI for primitives.
- **RAG-specific UX**: Chat is user question + assistant response + source citations. Generic chat libraries (MinChat, Stream) target real-time messaging and are tied to their backends or SaaS.
- **Extensibility**: Custom components with shadcn/ui give full control over message layout, citation links, and streaming display.
- **License**: shadcn/ui is MIT; no extra licensing risk.

### Alternatives Considered

| Library | License | Rejected Because |
|---------|---------|------------------|
| @minchat/react-chat-ui | MIT | Tied to MinChat backend; RAG API is custom local API |
| Stream Chat React | Commercial | License unclear; SaaS-oriented |
| Vercel AI SDK (useChat) | Apache-2.0 | Optimized for OpenAI-style APIs; RAG API format differs; would need heavy adaptation |

---

## 2. File Upload Library

### Decision

**react-dropzone** (MIT)

### Rationale

- **License**: MIT — free for commercial use.
- **Validation**: `maxSize`, `accept`, and `validator` support PDF-only and 20MB limit (FR-015).
- **Rejection handling**: `onDropRejected` and `fileRejections` for UX-010 feedback.
- **Adoption**: 7.6M+ weekly downloads, 4.4K dependents.
- **Security**: No known critical vulnerabilities; maintained.

### Usage Pattern

```ts
useDropzone({
  accept: { 'application/pdf': ['.pdf'] },
  maxSize: 20 * 1024 * 1024, // 20MB
  maxFiles: 1,
  onDropRejected: (rejections) => { /* UX-010 feedback */ },
  validator: (file) => { /* extra checks if needed */ },
});
```

### Alternatives Considered

| Library | License | Rejected Because |
|---------|---------|------------------|
| react-advanced-pdf-upload | MIT | Stale (3+ years); PDF manipulation focus, not simple upload |
| Uppy | MIT | Heavier; react-dropzone sufficient for single PDF upload |

---

## 3. Authentication & Token Management

### Decision

**Custom TokenManager** — no third-party auth library.

### Rationale

- **Constitution**: Access token in memory (closure or Zustand); refresh token in HttpOnly cookie; no localStorage/sessionStorage for tokens.
- **Internal token service**: All token issuance goes through internal backend; no external OAuth/IdP.
- **Existing libraries**: axios-jwt, react-auth-kit, SuperTokens use localStorage or their own storage; none match the constitution.

### Implementation Approach

- **Access token**: Zustand store (in-memory) or closure; attached via fetch/axios interceptor.
- **Refresh token**: HttpOnly cookie set by backend; `credentials: 'include'` on requests.
- **TokenManager**: On 401, call internal `/refresh` with `credentials: 'include'`; backend returns new access token (e.g. in body or Set-Cookie); update in-memory store; retry original request.
- **No retry on 401/403**: Per constitution; TokenManager handles 401 via refresh; 403 = forbidden, no retry.

### Alternatives Considered

| Library | Rejected Because |
|---------|-------------------|
| axios-jwt | Stores tokens in localStorage |
| react-auth-kit | localStorage-based |
| SuperTokens | Full auth stack; we only need token handling for existing API |

---

## 4. Security & License Verification

### Decision

All chosen dependencies are safe and free for commercial use.

### Verification

| Package | License | Security |
|---------|---------|----------|
| react-dropzone | MIT | No known critical vulns; actively maintained |
| shadcn/ui | MIT | Component library; no runtime network code |
| TanStack Query | MIT | Widely used; regular updates |
| Zustand | MIT | Minimal surface; no known issues |
| Vite, React, TypeScript | MIT | Core tooling |
| Tailwind, Framer Motion, react-i18next | MIT | Standard ecosystem |
| idb-keyval | MIT | IndexedDB wrapper; minimal |

### Practices

- Run `npm audit` in CI.
- Prefer MIT or Apache-2.0; avoid GPL/AGPL for commercial use.
- No tokens in localStorage/sessionStorage; HttpOnly cookie for refresh only.

---

## 5. Restrained Colors (UI Requirement)

### Decision

**CSS variables + muted palette** — no extra library.

### Rationale

- Constitution already uses CSS variables for theming.
- Define restrained palette in `:root` (e.g. grays, soft blues/greens).
- Avoid bright accent colors; use subtle borders and backgrounds.
- shadcn/ui theming supports CSS variables; align with restrained palette.

---

## Summary Table

| Concern | Decision | Key Point |
|---------|----------|-----------|
| Chat/message library | shadcn/ui + custom | Constitution + RAG-specific UX |
| File upload | react-dropzone | MIT, validation, 20MB PDF |
| Auth/token | Custom TokenManager | Constitution: memory + HttpOnly |
| Security | All MIT/Apache-2.0 | npm audit; no token storage violations |
| Restrained colors | CSS variables | Muted palette in theme |
