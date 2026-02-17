# Google Sheets Skill — File Breakdown

## `SKILL.md` — The skill's instruction manual for the agent

This is the file OpenClaw reads when the skill is activated. It tells the agent:
- What the skill does (Google Sheets CLI)
- When to use it vs not (service accounts only, not OAuth)
- Setup steps (enable API, create service account, share spreadsheets)
- How to install and run it (`npm install`, then `node scripts/sheets-cli.js <command>`)
- The full command map (read, write, format, merge, create sheets, etc.)
- Credential resolution order (env vars → local files → `~/.config`)

Think of it as the prompt context the agent gets so it knows how to wield the tool.

---

## `_meta.json` — Registry metadata

Identifies the skill in the OpenClaw skills catalog:
- Owner: `codedao12`
- Slug: `google-sheets-api`
- Current version: `1.0.3`
- Publish timestamp and commit hash

This is what the skill store reads — not used by the agent at runtime.

---

## `env_example.md` — Credential setup template

A reference showing the four ways to provide Google service account credentials via environment variables, plus the auto-detected file paths. It's a `.env` example the user copies from — the agent doesn't read this at runtime.

---

## `assets/sheets-api-guide.md` — Deep reference for the LLM

A detailed field guide covering the Google Sheets API internals: auth models, scopes, endpoint names, request body shapes, formatting gotchas (colors are 0–1 floats, not 0–255), and rate limits. This gives the agent enough context to construct correct API calls without hallucinating parameter names. It's supplementary knowledge the agent can reference when SKILL.md isn't detailed enough.

---

## `scripts/sheets-cli.js` — The actual tool (715 lines of Node.js)

This is the CLI the agent calls via `exec`. It's a single-file Node script that wraps the `googleapis` library. The flow:

```
CLI invocation
  ↓
parseArgs()          → extract command + flags from argv
  ↓
resolveCredentials() → check env vars → check local files → fail
  ↓
getSheetsClient()    → auth with service account, pick read-only vs read-write scope
  ↓
switch(command)      → dispatch to the right Google Sheets API call
  ↓
JSON.stringify()     → print result to stdout (agent reads this)
```

It supports 20+ commands across four categories:

| Category | Commands |
|----------|----------|
| **Data** | `read`, `write`, `append`, `clear`, `batchGet`, `batchWrite` |
| **Formatting** | `format`, `getFormat`, `borders`, `merge`, `unmerge`, `copyFormat` |
| **Layout** | `resize`, `autoResize`, `freeze` |
| **Sheet mgmt** | `create`, `info`, `addSheet`, `deleteSheet`, `renameSheet`, `batch` |

Key design choices:
- JSON input can be inline or loaded from file with `@path` syntax (line 111–123)
- Read-only commands use a narrower OAuth scope automatically (line 310)
- Clients are cached per scope so repeated calls don't re-auth (line 97–109)
- A1 notation is parsed into grid ranges for formatting/structural ops (line 134–161)
- Colors are normalized from 0–255 to 0–1 floats to match the API (line 181–188)
