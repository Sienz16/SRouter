# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

SRouter is a pnpm/Turborepo monorepo for a multi-provider LLM gateway. It exposes OpenAI- and Anthropic-compatible APIs, persists provider/API-key/request-log data in SQLite, and includes a React dashboard for operating the gateway.

- `apps/api` is the Hono server. It listens on port `3000`, mounts the versioned routes under `src/routes/v1`, and separates route wiring, controllers, and business logic. `src/services/registry.ts` builds the runtime provider registry from environment-configured providers and saved SQLite providers; `src/services/tokenRefresh.ts` handles OAuth token refresh and lazy/scheduled refreshes.
- `apps/web` is the Vite + React dashboard on port `5173`. TanStack Router file routes live in `src/routes`; `src/main.tsx` supplies the router, React Query client, theme provider, and toaster. `src/lib/api.ts` is the typed fetch wrapper used by route/components, and the Vite dev server proxies `/v1` to the API.
- `packages/types` contains shared TypeScript domain types and Zod schemas used by the API, providers, and web app.
- `packages/providers` contains provider catalog/registry abstractions and provider-facing contracts. Provider implementations are adapted into runtime executors in `packages/executors`.
- `packages/executors` contains concrete provider executors (OpenAI, Anthropic, OAuth-backed providers such as Codex/Antigravity/Kiro, and others). Executors use the shared provider contracts and translator.
- `packages/translator` handles OpenAI/Anthropic protocol translation and usage normalization, using `packages/pricing` for cost calculations.
- `packages/db` owns the native `node:sqlite` database initialization and repositories for providers, API keys, OAuth sessions, quotas, and request logs. The API database file is `apps/api/srouter.db`.

For a request, the API route applies validation and delegates to a controller/logic module. Chat/model logic resolves a provider through the registry, invokes an executor, translates protocol/streaming output as needed, and records usage/log data through the database package. The dashboard calls the API over the `/v1` proxy and uses React Query for server state.

## Development commands

Prerequisites: Node.js 22+ (24+ also supported) and pnpm 10+ (the repository declares pnpm 11.17+ as its package-manager dev engine).

**Hard rule: Claude Code and its agents must never execute `pnpm run`, `pnpm dev`, or `pnpm build`, including filtered, chained, wrapped, or equivalent invocations.** A project PreToolUse hook enforces this rule before Bash commands run. Do not work around the hook with `cd`, `env`, `corepack`, `npx`, shell chaining, or another wrapper.

Safe package-manager inspection commands include:

```bash
pnpm install              # install workspace dependencies when explicitly needed
pnpm --version            # inspect the installed package-manager version
pnpm list --depth 0       # inspect workspace dependencies
pnpm format:check         # check formatting without writing
pnpm lint                 # run configured workspace lint tasks
pnpm test                 # run all configured workspace tests
pnpm clean                # remove generated dist/Turbo output
```

Saved providers are loaded from SQLite when the API starts. Do not use the live database for tests that can mutate provider state; API tests run serially because they share database-backed state.

### Targeted tests

Tests use `tsx --test` and glob-based package scripts. Do not invoke a package `build` script to prepare them; use an already-built workspace or ask the user to perform any required build step themselves. The hook blocks prohibited build/dev/run forms.

```bash
pnpm --filter api exec tsx --test --test-concurrency=1 tests/token-refresh.test.ts
pnpm --filter api exec tsx --test --test-concurrency=1 tests/neosantara-provider.test.ts
pnpm --filter @srouter/providers exec tsx --test tests/registry.test.ts
pnpm --filter @srouter/executors exec tsx --test tests/kiro.test.ts
```

Use `pnpm --filter <workspace> test` for the package’s complete test suite. The web package currently has a build and lint pipeline but no package test script.

## Repository rules

Detailed modularity and naming rules are maintained in `.claude/rules/` and are automatically loaded by Claude Code:

- `.claude/rules/backend-modularity.md` — backend responsibilities, dependency direction, feature boundaries, and size signals.
- `.claude/rules/frontend-modularity.md` — frontend route/component boundaries, dependency direction, and size signals.
- `.claude/rules/naming-conventions.md` — frontend hook, context, provider, and component file placement/naming.
- `.claude/rules/codegraph-first.md` — CodeGraph-first code search and dependency-tracing workflow.

These rules apply to new files and existing files being changed. They do not require a whole-codebase refactor unless the task explicitly requests one.

## Implementation conventions and boundaries

## Implementation conventions and boundaries

- Keep shared contracts in `packages/types` rather than duplicating request/response shapes in apps. API request validation should use the existing Zod schemas and OpenAI-style error responses in `apps/api/src/middleware/validator.ts`.
- Add API behavior through the existing route → controller → logic layering. Keep provider selection/registration in the registry and provider-specific network/auth behavior in the relevant executor/provider package.
- When adding a provider, account for both the catalog/registry contract in `packages/providers` and runtime construction in `apps/api/src/services/registry.ts`; OAuth-backed providers may also require token refresh handling and DB fields.
- Keep persistence changes in `packages/db`, including schema initialization/migrations in `packages/db/src/db.ts`, and update the shared types/repositories together.
- Add dashboard pages as TanStack file routes and use `apps/web/src/lib/api.ts` plus React Query for API state. Generated `apps/web/src/routeTree.gen.ts` is produced by the TanStack Router tooling; prefer editing source route files rather than the generated tree.
- Workspace packages compile to `dist` and are consumed through their package exports. Turbo builds dependency packages before dependent app/package tasks (`build`, `dev`, `start`, and `test` where configured).
- Match the repository’s Prettier configuration: four-space indentation, double quotes, and a 100-character print width. The web package has its own ESLint script; shared packages primarily rely on TypeScript compilation and their package tests.
