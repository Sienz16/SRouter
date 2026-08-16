# AGENTS.md

This file serves as the memory and operational guide for all AI coding agents working within the **SRouter** repository.

---

## Repository Identity & Core Architecture

**SRouter** is an AI Gateway and LLM proxy router that unifies OpenAI and Anthropic compatible APIs with SQLite persistence (WAL mode) and a Vite + React dashboard.

### Workspaces & Responsibilities

| Directory             | Package / App         | Core Purpose                                                                                      |
| :-------------------- | :-------------------- | :------------------------------------------------------------------------------------------------ |
| `apps/api`            | `api`                 | Hono REST API server (Port 3000), routing, controllers, provider registry, auth/token management. |
| `apps/web`            | `web`                 | Vite + React 19 + TanStack Router web dashboard (Port 5173), React Query, `/v1` proxy.            |
| `packages/types`      | `@srouter/types`      | Shared TypeScript domain models, interfaces, and Zod schemas.                                     |
| `packages/providers`  | `@srouter/providers`  | Provider catalog definitions, interfaces, and registry contracts.                                 |
| `packages/executors`  | `@srouter/executors`  | Upstream LLM executors (OpenAI, Anthropic, Codex, Antigravity, Kiro, Qoder, etc.).                |
| `packages/translator` | `@srouter/translator` | Protocol translations (OpenAI ↔ Anthropic ↔ Gemini) and usage token normalization.                |
| `packages/pricing`    | `@srouter/pricing`    | Token pricing calculator.                                                                         |
| `packages/db`         | `@srouter/db`         | Node native `node:sqlite` database repository layer (`apps/api/srouter.db`).                      |
| `packages/constants`  | `@srouter/constants`  | Shared workspace constants.                                                                       |

---

## STRICT OPERATIONAL RULES

1. **NEVER RUN BUILD OR LIVE/DEV SERVERS**:
    - `pnpm dev`, `pnpm start`, `pnpm build`, `turbo dev`, `turbo build`, `npm run dev`, `npm run build` or any wrapper is **strictly forbidden**.
    - Do not trigger background or foreground web/API server processes.
2. **Safe Verification Commands**:
    - `pnpm format:check` — Verify code formatting.
    - `pnpm lint` — Run static linting.
    - `pnpm test` or targeted serial test execution:
      `pnpm --filter <pkg> exec tsx --test --test-concurrency=1 tests/<name>.test.ts`
3. **Database Integrity**:
    - Never run destructive tests against live database `apps/api/srouter.db`.

---

## Architectural & Code Conventions

- **Backend Layers**: `Route` (wiring/validation) → `Controller` (HTTP) → `Logic / Service` (business logic) → `DB / Provider Executors`.
- **Frontend Layers**: `Route` (thin composition) → `Feature Components` (`src/components/<feature>/`) → `UI Primitives` (`src/components/ui/`) / `API Client` (`src/lib/api.ts`).
- **Hook Naming**: `apps/web/src/hooks/use<Name>.ts` (single word `<Name>`).
- **Context Naming**: `apps/web/src/context/<Name>.tsx` (PascalCase).
- **Code Style**: 4-space indentation, double quotes `"`, 100 max line width.
