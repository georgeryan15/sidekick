# SkillBuilder System

## Overview

SkillBuilder is a handoff agent that automatically creates new Sidekick skills by searching the web for API docs and generating the required files.

## Architecture

```
User: "Build me a skill for the Cat Facts API"
  │
  ▼
Sidekick Agent (server/src/agent.ts)
  │  handoff("transfer_to_SkillBuilder")
  ▼
SkillBuilder Agent (server/src/agents/skillBuilder.ts)
  ├─ webSearchTool()          ← finds API documentation
  ├─ write_skill_file()       ← writes files scoped to server/skills/ only
  └─ tells user to restart    ← hot-reload not yet supported
```

## Key Files

| File | Purpose |
|------|---------|
| `server/src/agents/skillBuilder.ts` | Agent definition, instructions, and tool wiring |
| `server/src/tools/writeSkillFile.ts` | Scoped file writer — only allows writes under `server/skills/<skillName>/` |
| `server/src/agent.ts` | Main Sidekick agent — imports and registers the handoff |

## Skill Directory Structure

Each skill produced by SkillBuilder follows this layout:

```
server/skills/<skillName>/
├── SKILL.md              ← YAML frontmatter (name, description) + markdown instructions
└── scripts/
    └── <skillName>.sh    ← Bash script using curl for API calls
```

### SKILL.md Format

```markdown
---
name: catfacts
description: Fetch random cat facts
---

# Cat Facts Skill

## Available Commands

### Random Fact
{baseDir}/scripts/catfacts.sh fact

## Usage Notes
- command: `{baseDir}/scripts/catfacts.sh`
- args: `["fact"]`
```

`{baseDir}` is resolved by the skill loader at startup to the skill's absolute directory path.

### Script Conventions

- `#!/usr/bin/env bash` + `set -euo pipefail`
- `curl -sf` for HTTP requests
- Case statement for subcommands with a `usage()` fallback

## How It Works

1. User asks Sidekick to build a skill
2. Sidekick hands off to SkillBuilder via the SDK `handoff()` mechanism
3. SkillBuilder searches the web for API docs
4. SkillBuilder confirms endpoints with the user
5. SkillBuilder writes `SKILL.md` and script(s) using `write_skill_file`
6. SkillBuilder tells the user to restart the server
7. On restart, `server/src/skills/loader.ts` picks up the new skill directory automatically
