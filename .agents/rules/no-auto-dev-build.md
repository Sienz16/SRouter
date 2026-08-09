# Rule: Command Execution Safety - No Automatic `dev` or `build` Execution

- NEVER automatically execute `pnpm dev`, `pnpm build`, `npm run dev`, `npm run build`, `turbo build`, or similar server/build commands unless the user explicitly requests or instructs you to run them in their prompt.
- Perform code edits and static checks directly without launching background build/dev tasks unless requested by the user.
