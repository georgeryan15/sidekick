You are Claude Code. Build a minimal full-stack starter that matches this architecture:

Goal

- Electron + React frontend: simple chat UI.
- ExpressJS/Node backend: exposes a small “tool execution” API that can run third-party integrations via a schema-driven CLI runner.
- Keep functionality basic but architecture correct and safe-by-default.

Core architecture requirements (VERY IMPORTANT)

1. Do NOT allow arbitrary shell execution from the model/UI.
2. Implement a single “core runner” (one binary/script) that:
   - Loads an integration spec JSON (per integration) from disk (./specs/) for now.
   - Validates requested {integration, command, args} against the spec (required args, types, where to put them).
   - Builds and executes ONLY a constrained command, not user-provided shell strings.
   - Outputs consistent JSON: { ok: boolean, status?: number, data?: any, error?: string, details?: any }.
   - Enforces timeout, max output size, and sanitizes logs (don’t print secrets).
3. Backend exposes tool-like endpoints:
   - GET /api/integrations -> list available integrations (from ./specs).
   - GET /api/integrations/:name -> return spec (safe fields only).
   - POST /api/tools/integrate_run -> { integration, command, args } -> executes via core runner -> returns JSON.
4. Auth/secrets
   - Specs must not contain secrets.
   - Read tokens from environment variables (e.g., ASANA_TOKEN) referenced by spec auth.envVar.
5. Logging & auditing
   - Log each run: timestamp, integration, command, args keys (not values if sensitive), status, duration.
6. Keep it basic: no database, no queues, no multi-tenancy. Just local specs + env vars.

Implementation details

- Use TypeScript across repo.
- Use Node 20+.
- Use native fetch in Node.
- For process execution, prefer spawning the core runner as a child process with args (NOT passing raw shell).
- For JSON parsing/printing, ensure stable output. The core runner must always print JSON to stdout.

Repo structure

- /apps/desktop (Electron + React)
- /apps/api (Express backend)
- /packages/runner (core runner CLI)
- /specs (integration specs JSON)

Runner CLI contract

- Command: runner run <integration> <command> --json '<argsJson>'
  Example: runner run asana list-tasks --json '{"projectId":"123"}'
- The runner reads ./specs/<integration>.json, validates, performs the HTTP request (or optionally spawns a vendor CLI later).
- Output JSON only.

Spec format (implement this exact shape)
{
"name": "asana",
"baseUrl": "https://app.asana.com/api/1.0",
"auth": { "type": "bearer", "envVar": "ASANA_TOKEN" },
"commands": {
"list-tasks": {
"method": "GET",
"path": "/tasks",
"args": [
{ "name": "projectId", "in": "query", "key": "project", "type": "string", "required": true },
{ "name": "limit", "in": "query", "key": "limit", "type": "number", "required": false }
]
}
}
}

Frontend requirements

- Minimal chat UI: messages list + input box + send button.
- On send:
  1. POST /api/chat with { message }.
  2. Backend returns a simple mocked assistant response AND optionally triggers an integrate_run call if the message includes a keyword like “asana list tasks projectId=123”.
- Keep the “agent” logic dumb: simple regex parsing is fine for now. The point is wiring + tool execution.

Backend requirements

- POST /api/chat:
  - If message matches pattern “asana list-tasks projectId=123”, call integrate_run internally:
    POST /api/tools/integrate_run with args.
  - Return assistant message containing either tool output summary or error.
- Security:
  - Validate integration/command exist.
  - Reject unknown args.
  - Timeouts enforced in runner (e.g., 15s).
  - Limit output size (e.g., 256KB).

Deliverables

- Working dev scripts (pnpm preferred):
  - pnpm dev: runs api + desktop
- Clear README with:
  - env var setup (ASANA_TOKEN)
  - how to add a new spec
  - example curl calls to api endpoints
- Include one example spec: specs/asana.json

Now implement the project end-to-end with the above constraints. Provide all code files, configs, and instructions.
