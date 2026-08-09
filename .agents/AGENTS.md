# SRouter Workspace Instructions & Rules

## Code Quality & Type Safety Rules

- **No `any` or `unknown` Type**: Do NOT use `any` or `unknown` anywhere in `@srouter/types`, `@srouter/providers`, `@srouter/db`, or `apps/api`. Every variable, parameter, return type, Zod schema, and database entity MUST be explicitly and concretely typed with interfaces/types ("wajib ada wujudnya").

## Command Execution & Workflow Rules

- **No Automatic Commit or Push**: NEVER execute `git commit` or `git push` unless the user explicitly requests it in their prompt.
- **No Automatic `dev` or `build` Commands**: NEVER execute `pnpm dev`, `pnpm build`, `npm run dev`, `npm run build`, `turbo build`, or similar background dev/build commands unless the user explicitly asks you to run them.
