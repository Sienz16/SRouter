# SRouter Workspace Instructions & Rules

## Code Quality & Type Safety Rules
- **No `any` or `unknown` Type**: Do NOT use `any` or `unknown` anywhere in `@srouter/types`, `@srouter/providers`, `@srouter/db`, or `apps/api`. Every variable, parameter, return type, Zod schema, and database entity MUST be explicitly and concretely typed with interfaces/types ("wajib ada wujudnya").
