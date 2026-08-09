# Rule: Strict TypeScript - No `any` and No `unknown` Types Allowed

- NEVER use `any` or `unknown` anywhere in this project.
- Every type, interface, function parameter, return type, Zod schema, and database query MUST have a concrete, explicit type definition ("wajib ada wujudnya").
- Use concrete interfaces, type aliases, union literals, or generics with explicit constraints.
- For error handling in `catch` blocks, cast caught errors explicitly to `Error` (e.g. `const error = err as Error;`).
- Database query results must be directly cast to explicit row interfaces (e.g. `query.all() as DBRow[]`).
- Zod schemas must use explicit sub-schemas (e.g. `ToolSchema`) instead of generic schemas.
