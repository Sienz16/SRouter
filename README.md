# SRouter 🚀

**SRouter** is a high-performance, multi-provider LLM API Gateway and Proxy router built with [Hono](https://hono.dev/), TypeScript, and native SQLite (`node:sqlite`).

Inspired by 9Router Proxy, SRouter provides unified OpenAI & Anthropic compatible API endpoints, dynamic real-time model discovery, API key management, and request logging.

---

## 🌟 Key Features

- **OpenAI & Anthropic Compatible Endpoints**:
  - `POST /v1/chat/completions` (JSON & Server-Sent Events SSE Streaming)
  - `GET /v1/models` & `GET /v1/models/:model`
  - OpenAI <-> Anthropic protocol translation adapter
- **Multi-Provider Catalog**:
  - Supports Custom OpenAI/Anthropic proxies, OAuth sessions, Free Tier providers, and direct API key providers (Anthropic, DeepSeek, Groq, Cohere, OpenRouter, Cerebras, Azure OpenAI, etc.).
  - **Dynamic Model Listing**: Live model fetching directly from official provider APIs.
- **Embedded SQLite Database (`node:sqlite`)**:
  - High-performance WAL mode SQLite database for storing provider configs, client API keys (`sr-live-xxxx`), and request token usage logs.
- **Strict Type Safety & Zod Validation**:
  - 100% concrete TypeScript types (Zero `any`, Zero `unknown`).
  - Request body validation powered by `@hono/zod-validator` returning OpenAI-standard error formats.

---

## 📂 Monorepo Architecture

- `apps/api`: Main Hono API server listening on port `3000`.
- `packages/types`: Workspace types and Zod schemas (`ChatCompletionRequestSchema`, `CreateAPIKeySchema`, etc.).
- `packages/providers`: Provider drivers (`OpenAIProvider`, `AnthropicProvider`, `OpenRouterProvider`, `MockProvider`) and protocol translation adapter.
- `packages/db`: SQLite database initialization, API keys repository, and request logging module (`srouter.db`).

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v22+` or `v24+`
- `pnpm` `v10+`

### Installation

```bash
pnpm install
```

### Development Server

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/v1/models` | List all available models across providers |
| `GET` | `/v1/providers/catalog` | List categorized providers (custom, oauth, free_tier, api_key) |
| `POST` | `/v1/chat/completions` | Create chat completion (supports `stream: true`) |
| `GET` | `/v1/keys` | List client API keys |
| `POST` | `/v1/keys` | Create client API key |
| `GET` | `/v1/logs` | View recent request logs |
| `GET` | `/v1/logs/stats` | View token usage summary |

---

## 📄 License

[MIT](LICENSE)
