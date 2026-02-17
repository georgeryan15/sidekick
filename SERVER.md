# Server Structure

## `server/src/`

| File | Purpose |
|------|---------|
| `index.ts` | Entry point — starts the Express server |
| `app.ts` | Express app setup — middleware (CORS, JSON) and route mounting |
| `agent.ts` | Creates the OpenAI Agent instance with dynamically generated tools |
| `tools.ts` | Reads spec files and converts each command into an OpenAI `tool()` definition |
| `config/index.ts` | Loads `.env`, exports `PORT` and `SPECS_DIR` constants |
| `routes/chat.ts` | `POST /api/chat` — SSE streaming chat with the agent |
| `routes/integrations.ts` | `GET /api/integrations` — list specs; `GET /:name` — get spec; `POST /run` — execute a tool directly |
| `agents/spec-builder.ts` | SpecBuilder handoff agent — reads API docs via URL and generates a spec JSON file |

## `server/runner/`

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript interfaces for spec shape (`IntegrationSpec`, `CommandSpec`, etc.) |
| `loader.ts` | Reads and parses `specs/*.json` files from disk |
| `validator.ts` | Validates tool call args against a command's spec (required fields, types, allowed names) |
| `executor.ts` | Builds a constrained `fetch()` request from spec + validated args, with timeout and size limits |
| `index.ts` | Programmatic `runCommand()` entry point + CLI mode (`tsx runner/index.ts run <spec> <cmd>`) |
