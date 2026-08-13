# Backend Modularity Rules

These rules apply to new backend files and existing backend files being changed. They do not require a whole-codebase refactor unless the task explicitly requests one.

## Responsibilities

- Keep one primary responsibility per file and module.
- Routes define endpoint wiring, middleware, and validation.
- Controllers handle HTTP input/output and delegate behavior.
- Logic/services own business flows and orchestration.
- Repositories/database modules own persistence.
- Provider/executor modules own external integrations.
- Utilities contain only genuinely reusable generic helpers.

## Dependency direction

Keep the default dependency direction one-way:

```text
route → controller → logic/service → repository/provider
```

Lower layers must not import HTTP routes, controllers, or frontend code. Explicit exceptions are shared types/schemas, protocol translators/adapters, and the provider registry where cross-provider routing requires it.

## Feature boundaries

- Preserve the existing `routes`, `controllers`, `logic`, `services`, and workspace-package boundaries.
- When a feature grows across multiple layers, organize new work around that feature without forcing a broad migration.
- Create shared modules only for behavior used by multiple features.
- Avoid god utilities, hidden global state, and modules that mix unrelated business concerns.

## Size signals

A file over roughly 300 lines or a function over roughly 50 lines is a review signal to consider splitting the module. These are pragmatic signals, not absolute bans; keep a larger unit when splitting it would create worse abstractions or obscure the behavior.

Every new module should have a clear interface/use case and should not expose implementation details unnecessarily. When changing legacy code, improve only the touched area when it is safe and directly relevant; do not start unrelated broad refactors.
