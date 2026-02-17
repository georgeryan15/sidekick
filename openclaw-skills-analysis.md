# How OpenClaw Executes API Calls from SKILL.md Files

## How It Works

OpenClaw does **not** programmatically parse SKILL.md into tool schemas. Instead, it uses a prompt-injection model:

```
SKILL.md files (markdown)
  → Loaded at startup from three locations (workspace > local > bundled)
    → Filtered by OS, required binaries, env vars, config
      → Injected as compact XML into the LLM's system prompt
        → LLM reads the instructions and decides what to do
          → LLM invokes generic tools (bash, HTTP) to execute the calls
```

The key insight: **the LLM is the parser**. There is no Zod schema, no typed validation layer, no programmatic HTTP builder. The SKILL.md describes the API (endpoints, auth, parameters, examples) and the LLM constructs the correct commands by reading that documentation.

### Supporting Infrastructure

OpenClaw does provide some programmatic scaffolding around skills:

- **Environment injection** — Secrets/API keys are injected per agent run via config, so the LLM can reference them
- **Load-time filtering** — Skills are gated by OS, required binaries, env vars, etc.
- **Hot reload** — File watcher detects SKILL.md changes mid-session
- **Direct dispatch** — For skills with `command-dispatch: tool`, OpenClaw bypasses the LLM and dispatches directly to a tool
- **Token overhead** — ~195 chars base + ~97 chars per skill added to the prompt

### What the LLM Actually Executes

Looking at the Asana SKILL.md as an example, the skill bundles Node.js helper scripts (`scripts/asana_api.mjs`, `scripts/oauth_oob.mjs`). The SKILL.md teaches the LLM to invoke these scripts via bash:

```
User: "list tasks assigned to me"
  → LLM reads SKILL.md, maps to: node scripts/asana_api.mjs tasks-assigned --assignee me
    → LLM executes via bash tool
      → Script handles HTTP call, auth, token refresh
        → Returns result to LLM
```

So in the Asana case, the LLM isn't making raw HTTP calls — it's calling **wrapper scripts** that the skill author wrote. The SKILL.md is essentially a user manual for those scripts.

Other skills may have the LLM make direct `curl` calls or use other tools — the format is flexible by design.

## Comparison to Sidekick's JSON Spec Approach

| Aspect | OpenClaw (SKILL.md) | Sidekick (JSON specs) |
|--------|---------------------|----------------------|
| **Parser** | The LLM | Programmatic (Zod + TypeScript) |
| **Schema validation** | None — trust the LLM | Compile-time type checking |
| **Complex types** | Free — LLM reads docs | Currently unsupported (primitives only) |
| **Token cost** | Entire skill docs in every prompt | Only tool name + param schema |
| **Execution** | LLM calls bash/curl/scripts | Executor builds HTTP request from validated args |
| **Security** | LLM has access to generic tools | Constrained to declared endpoints |
| **Reliability** | Non-deterministic | Deterministic request shape |
| **Authoring** | Write markdown | Write JSON to a specific format |
| **Helper scripts** | Common pattern (skill bundles scripts) | Not needed (executor handles HTTP) |

## Key Takeaway

OpenClaw's approach works because it **offloads complexity to the LLM and to helper scripts**. The SKILL.md isn't a machine-readable spec — it's documentation that teaches the LLM how to use bundled tools. This is powerful and flexible, but means every API call costs more tokens and has no structural guarantees.

Sources:
- [OpenClaw Skills Documentation](https://docs.openclaw.ai/tools/skills)
- [OpenClaw Skills Repository](https://github.com/openclaw/skills)
- [Asana SKILL.md](https://github.com/openclaw/skills/blob/main/skills/k0nkupa/asana/SKILL.md)
- [Attio SKILL.md](https://github.com/openclaw/skills/blob/main/skills/andrewdmwalker/attio/SKILL.md)
