# Frontend Modularity Rules

These rules apply to new frontend files and existing frontend files being changed. They do not require a whole-codebase refactor unless the task explicitly requests one.

## Responsibilities

- Keep route files thin: route definition, lightweight query orchestration, and page composition only.
- Put complex UI in `apps/web/src/components/<feature>/`.
- Keep reusable primitives in `apps/web/src/components/ui/`.
- Keep API access in `apps/web/src/lib/api.ts` or a clearly named feature API module, rather than embedding fetch logic throughout components.

## Dependency direction

Use this default dependency direction:

```text
route → feature component → shared UI/lib
```

Shared UI components must not import routes or feature-specific business logic. Context may be used by components that genuinely need state across a component tree, but feature state should not be hidden in a global context without a clear cross-tree requirement.

## Feature boundaries

- Group new feature-specific components, types, and helpers under the feature directory.
- Create shared modules only when behavior is used by multiple features.
- Avoid duplicated state, duplicated hooks, and components that combine data fetching, business rules, and complex presentation when those responsibilities can be separated.

## Size signals

A file over roughly 300 lines or a function over roughly 50 lines is a review signal to consider splitting the module. These are pragmatic signals, not absolute bans; keep a larger unit when splitting it would create worse abstractions or obscure the behavior.

When changing legacy code, improve only the touched area when it is safe and directly relevant; do not start unrelated broad refactors.
