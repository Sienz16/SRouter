---
name: srouter-backend
description: |
    Master guide and reference for SRouter backend development. Use whenever designing, refactoring, building, or debugging Hono API endpoints, SQLite database repositories, multi-provider LLM drivers, and protocol translation adapters.
---

# SRouter Backend Architecture & Guidelines

SRouter is a high-performance multi-provider LLM gateway built with Hono, TypeScript, and native SQLite (`node:sqlite`).

---

## 🏗️ Core Package Responsibilities

### 1. `@srouter/types` (`packages/types`)

- Defines all concrete TypeScript interfaces, types, and Zod schemas.
- **Rules**:
    - ZERO `any` or `unknown` allowed.
    - Every Zod schema must have concrete error messages.
    - Schemas (`ChatCompletionRequestSchema`, `CreateAPIKeySchema`, etc.) infer Zod types (`z.infer<typeof ...>`).

### 2. `@srouter/db` (`packages/db`)

- Native Node.js SQLite (`node:sqlite` `DatabaseSync`) connection module.
- High-performance WAL mode (`PRAGMA journal_mode = WAL`).
- Repositories:
    - `providers.ts`: Manage provider configs & OAuth tokens (`upsertProviderDB`, `getAllProvidersDB`).
    - `apiKeys.ts`: Client API Key generation (`sr-live-xxxx`) & quota tracking.
    - `logs.ts`: Request token usage analytics & latency logging.

### 3. `@srouter/providers` (`packages/providers`)

- LLM Provider Drivers (`OpenAIProvider`, `AnthropicProvider`, `OpenRouterProvider`, `MockProvider`).
- `adapter.ts`: OpenAI <-> Anthropic protocol converter (bidirectional message translation & SSE chunk mapping).
- `oauth.ts`: OpenAI Codex OAuth PKCE helper (`generatePKCE`, token exchange, auto-refresh).
- `registry.ts`: Provider routing engine.

### 4. `apps/api` (`apps/api`)

- Hono web framework running on `@hono/node-server`.
- Middleware:
    - `validator.ts`: Zod JSON validation middleware returning OpenAI-compatible errors (`{ error: { message, type: 'invalid_request_error' } }`).
- Routes:
    - `/v1/models`: OpenAI-compatible model listing.
    - `/v1/chat/completions`: Streaming SSE & JSON chat completion.
    - `/v1/auth/openai/*`: OAuth PKCE & token import endpoints.
    - `/v1/keys`: API Key CRUD.
    - `/v1/logs`: Analytics & stats.

---

## ⚡ Backend Best Practices

1. **Protocol Translation**:
    - Always translate Anthropic `/v1/messages` format into OpenAI `/v1/chat/completions` format seamlessly.
2. **Database Upserts**:
    - Use `ON CONFLICT(id) DO UPDATE` for SQLite provider updates to prevent primary key collisions.
3. **Streaming Performance**:
    - Always flush SSE data with `data: [DONE]` on generator completion.
