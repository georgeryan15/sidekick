# How OpenClaw Executes Skills on the Backend

## High-Level Architecture

```
User (WhatsApp/Telegram/Discord)
        │
        ▼
  ┌─────────────┐
  │   Gateway    │  ← Channel adapter receives message
  │  (Router)    │  ← Access control, session resolution
  └──────┬──────┘
         │
         ▼
  ┌─────────────────────────┐
  │  System Prompt Builder   │
  │  buildAgentSystemPrompt()│
  │                         │
  │  1. Load SOUL.md        │
  │  2. Load IDENTITY.md    │
  │  3. Load TOOLS.md       │
  │  4. Scan skills dirs    │  ← Skills discovered here
  │  5. Inject skill XML    │  ← formatSkillsForPrompt()
  └──────┬──────────────────┘
         │
         ▼
  ┌─────────────────────────┐
  │  Pi Agent Core Runtime   │
  │  (Claude / other LLM)   │
  │                         │
  │  System prompt includes: │
  │  • Identity & personality│
  │  • Tool definitions      │
  │  • <available_skills>    │  ← Compact XML list
  │    with descriptions     │
  └──────┬──────────────────┘
         │
         ▼
  Agent decides: "Does a skill apply?"
         │
    ┌────┴────┐
    │ Yes     │ No → normal response
    ▼
  read tool loads SKILL.md
  from disk at runtime
         │
         ▼
  Agent follows SKILL.md
  instructions (runs scripts, etc.)
```

## Skill Discovery: Where Skills Live

Skills are discovered from three locations, in priority order:

| Priority | Location | Purpose |
|----------|----------|---------|
| 1 (highest) | `~/.openclaw/workspace/skills/` | User-created / workspace skills |
| 2 | `~/.openclaw/managed-skills/` | Installed via `clawhub sync` |
| 3 (lowest) | `node_modules/openclaw/skills/` | Bundled with OpenClaw |

Higher-priority skills override lower ones with the same name. For the Linear skill in this folder, after running `clawhub sync`, it would land in `managed-skills/` as a directory containing `SKILL.md`, `_meta.json`, and the `scripts/` folder.

## SKILL.md: What It Is and How It Gets Parsed

`SKILL.md` is the core of every skill. It has two parts:

### 1. YAML Frontmatter (Machine-Readable Metadata)

```yaml
---
name: linear
description: Query and manage Linear issues, projects, and team workflows.
homepage: https://linear.app
metadata:
  { "clawdis": { "emoji": "📊", "requires": { "env": ["LINEAR_API_KEY"] } } }
---
```

The parser reads this frontmatter to extract:
- **name** — Skill identifier (`linear`)
- **description** — Used in the XML injected into the system prompt
- **requires.env** — Environment variables that must be set (`LINEAR_API_KEY`)
- **requires.bins** — Binaries that must exist on `$PATH` (e.g., `curl`, `jq`)

**Important:** The parser only supports single-line frontmatter keys. The metadata field must be a single-line JSON object.

### 2. Markdown Body (Agent-Readable Instructions)

Everything below the frontmatter is natural language documentation that the agent reads at runtime. This includes setup instructions, command references, workflow examples, and constraints. The agent follows these instructions literally when executing the skill.

## The `{baseDir}` Token — NOT Code-Level Substitution

Throughout the SKILL.md body, you'll see paths like:

```
{baseDir}/scripts/linear.sh my-issues
```

**`{baseDir}` is NOT replaced by OpenClaw's code.** There is no `.replace('{baseDir}', ...)` call or template engine. The raw literal `{baseDir}` string stays in the SKILL.md file as-is when the agent reads it.

Instead, it's a **convention for skill authors** that the LLM is expected to resolve on its own. The mechanism works through context clues:

```
formatSkillsForPrompt() generates XML with a <location> tag:
┌──────────────────────────────────────────────────────────────┐
│ <available_skills>                                           │
│   <skill name="linear"                                       │
│          location="~/.openclaw/managed-skills/linear/SKILL.md│
│     Query and manage Linear issues...                        │
│   </skill>                                                   │
│ </available_skills>                                          │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
Agent reads SKILL.md from that path, sees:
  {baseDir}/scripts/linear.sh my-issues
                         │
                         ▼
Agent infers from the <location> tag that it read the file from
  ~/.openclaw/managed-skills/linear/
  therefore {baseDir} = ~/.openclaw/managed-skills/linear
                         │
                         ▼
Agent executes: ~/.openclaw/managed-skills/linear/scripts/linear.sh my-issues
```

The LLM connects the dots: it knows which directory it read the SKILL.md from (via the `<location>` tag in the XML), so when it encounters `{baseDir}` in the instructions, it substitutes the parent directory of the file it just read. This is purely an LLM inference — not a backend string replacement.

## Load-Time Gating: Does the Skill Even Get Included?

Before a skill makes it into the system prompt, OpenClaw validates its requirements:

```
Skill discovered on disk
        │
        ▼
  ┌─────────────────────┐
  │  Check requires.env  │ → LINEAR_API_KEY set?
  │  Check requires.bins │ → curl, jq on PATH?
  │  Check requires.config│
  │  Check OS platform   │ → darwin/linux/win32
  └──────┬──────────────┘
         │
    ┌────┴────┐
    │ Pass    │ Fail → Skill excluded from prompt
    ▼
  Skill is eligible
```

If `LINEAR_API_KEY` is not set in the environment, this Linear skill would be **silently excluded** from the system prompt entirely. The agent would never know it exists.

## Snapshot Building and Caching

OpenClaw doesn't rescan the filesystem on every message. Instead:

1. **`buildWorkspaceSkillSnapshot()`** scans skill directories and extracts frontmatter
2. **`getSkillsSnapshotVersion()`** computes a hash of the workspace state
3. If the hash matches the previous run, the **cached snapshot is reused**
4. The snapshot contains pre-formatted XML, skill names, and resolved metadata

Skills are snapshotted when a session starts and reused for all subsequent turns in that session. Changes to `SKILL.md` files take effect on the **next new session** (unless the skills watcher is enabled for mid-session refresh).

## System Prompt Injection: What the Agent Actually Sees

`formatSkillsForPrompt()` generates a compact XML block injected into the system prompt:

```xml
<available_skills>
  <skill name="linear" path="~/.openclaw/managed-skills/linear/SKILL.md">
    Query and manage Linear issues, projects, and team workflows.
  </skill>
  <skill name="weather" path="~/.openclaw/managed-skills/weather/SKILL.md">
    Get weather forecasts for any location.
  </skill>
</available_skills>
```

The system prompt also includes this instruction:

> "If exactly one skill clearly applies: read its SKILL.md at the given path with the `read` tool, then follow it. If multiple could apply: choose the most specific one. Never read more than one skill up front."

**Key insight: The full SKILL.md content is NOT injected into the system prompt.** Only the name and description go in. The agent must actively `read` the file when it decides a skill is relevant. This keeps the system prompt lean.

## Full Execution Flow: User Message → Skill Execution

Here's the complete chain for "show me my Linear issues":

```
1. User sends "show me my Linear issues" via WhatsApp
                    │
2. Gateway routes → session resolved → agent config loaded
                    │
3. System prompt built:
   │  buildAgentSystemPrompt()
   │  ├── Load SOUL.md, IDENTITY.md, TOOLS.md
   │  ├── buildWorkspaceSkillSnapshot()  [cached if unchanged]
   │  └── formatSkillsForPrompt()
   │       → <available_skills> XML injected
                    │
4. LLM receives: system prompt + user message + session history
                    │
5. Agent scans <available_skills>, sees "linear" matches
                    │
6. Agent calls: read("~/.openclaw/managed-skills/linear/SKILL.md")
   │  → Gets full markdown with setup, commands, workflows
   │  → Sees raw {baseDir} tokens (NOT replaced by backend)
                    │
7. Agent infers {baseDir} = ~/.openclaw/managed-skills/linear/
   │  (from the <location> path it already knows)
   │  Executes: exec("~/.openclaw/managed-skills/linear/scripts/linear.sh my-issues")
                    │
8. linear.sh runs:
   │  → Reads LINEAR_API_KEY from environment
   │  → Sends GraphQL query to api.linear.app
   │  → Formats and returns issue list
                    │
9. Agent receives script output, formats response
                    │
10. Response sent back through Gateway → WhatsApp
```

## Environment Variable Injection

When an agent run begins, OpenClaw scopes environment variables to that run:

```
Agent run starts
        │
        ▼
  applySkillEnvOverridesFromSnapshot()
  │  Precedence: skill env > config.env > process.env
  │  LINEAR_API_KEY injected into process.env
        │
        ▼
  Agent executes (skill scripts can access env vars)
        │
        ▼
  Agent run ends
        │
        ▼
  Original environment restored (no permanent changes)
```

Skills can also configure `skills.entries.linear.env` and `skills.entries.linear.apiKey` in the OpenClaw config, which get applied automatically.

## PATH Injection for Skill Binaries

If a skill bundles executables in a `bins/` subdirectory:

- The `bins/` absolute path is prepended to `process.env.PATH` during the agent run
- Executables become available to the `exec` tool by name
- PATH is restored after the run completes

## The `_meta.json` File

```json
{
  "owner": "manuelhettich",
  "slug": "linear",
  "displayName": "Linear",
  "latest": {
    "version": "1.0.0",
    "publishedAt": 1767722342343,
    "commit": "https://github.com/clawdbot/skills/commit/..."
  },
  "history": []
}
```

This is **ClawHub registry metadata**, not used by the agent runtime. It tracks:
- Who published the skill
- Version history
- Source commit for auditing

ClawHub uses this for discovery, versioning, and the `clawhub sync` command.

## Key Functions Summary

| Function | What It Does |
|----------|-------------|
| `loadWorkspaceSkillEntries()` | Scans skill directories, applies filtering |
| `buildWorkspaceSkillSnapshot()` | Creates cached snapshot with metadata + XML |
| `getSkillsSnapshotVersion()` | Computes workspace hash for cache invalidation |
| `formatSkillsForPrompt()` | Generates `<available_skills>` XML for system prompt |
| `applySkillEnvOverridesFromSnapshot()` | Injects env vars scoped to agent run |
| `buildAgentSystemPrompt()` | Assembles the complete system prompt |

## TL;DR

1. **SKILL.md is NOT injected wholesale into the system prompt** — only the skill name + description go in as compact XML
2. **The agent reads SKILL.md on-demand** using the `read` tool when it determines a skill is relevant to the user's request
3. **`{baseDir}` is NOT replaced by backend code** — it's a raw token left in SKILL.md that the LLM infers from the `<location>` path in the XML
4. **Load-time gates** check that required env vars and binaries exist before a skill is even listed as available
5. **Snapshots are cached** per-session to avoid repeated filesystem scans
6. **Environment injection is scoped** — API keys are set for the run and restored after

---

## Sources

- [OpenClaw Skills System (DeepWiki)](https://deepwiki.com/openclaw/openclaw/6.3-skills-system)
- [OpenClaw Tools and Skills (DeepWiki)](https://deepwiki.com/openclaw/openclaw/6-tools-and-skills)
- [OpenClaw Official Skills Docs](https://docs.openclaw.ai/tools/skills)
- [OpenClaw System Prompt Study](https://github.com/seedprod/openclaw-prompts-and-skills/blob/main/OPENCLAW_SYSTEM_PROMPT_STUDY.md)
- [ClawHub Skill Directory (GitHub)](https://github.com/openclaw/clawhub)
- [OpenClaw Skills Repository (GitHub)](https://github.com/openclaw/skills)
