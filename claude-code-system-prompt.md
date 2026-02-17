# How Claude Code Assembles Its System Prompt

## Assembly Flow

```
Session Start
    ↓
Organization CLAUDE.md  (/Library/Application Support/ClaudeCode/CLAUDE.md)
    ↓
User-level CLAUDE.md    (~/.claude/CLAUDE.md + ~/.claude/rules/*.md)
    ↓
Project CLAUDE.md       (./CLAUDE.md or ./.claude/CLAUDE.md + ./.claude/rules/*.md)
    ↓
Project-local           (./CLAUDE.local.md — gitignored, personal)
    ↓
Auto Memory             (MEMORY.md — first 200 lines only)
    ↓
Skill Descriptions      (descriptions from all SKILL.md files)
    ↓
Settings                (model, language, permissions, outputStyle)
    ↓
SessionStart Hooks      (stdout from hooks with exit 0)
    ↓
═══ System Prompt Complete ═══
```

## The Key Sources

### 1. CLAUDE.md Files (hierarchical, all loaded at startup)

| Scope | Location | Who manages it |
|-------|----------|----------------|
| Organization | `/Library/Application Support/ClaudeCode/CLAUDE.md` | IT/DevOps |
| User | `~/.claude/CLAUDE.md` | You (global prefs) |
| User rules | `~/.claude/rules/*.md` | You (modular rules) |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team (committed) |
| Project rules | `./.claude/rules/*.md` | Team (modular) |
| Project local | `./CLAUDE.local.md` | You (gitignored) |
| Nested | `./subdir/CLAUDE.md` | **On-demand only** |

More specific scopes override broader ones. Files can import others with `@path/to/file` syntax (up to 5 hops deep).

### 2. Auto Memory (MEMORY.md)

- Lives at `~/.claude/projects/<project>/memory/MEMORY.md`
- Only the **first 200 lines** are injected into the system prompt
- Topic files (e.g., `debugging.md`, `patterns.md`) are read **on-demand** during the session, not pre-loaded
- Claude reads/writes these files itself to persist knowledge across sessions

### 3. Skills (two-phase loading)

```
Phase 1 (startup):   Load descriptions only → "skills catalog" in system prompt
Phase 2 (invocation): Load full SKILL.md content when invoked by user or Claude
```

- **Personal skills**: `~/.claude/skills/<name>/SKILL.md`
- **Project skills**: `.claude/skills/<name>/SKILL.md`
- Frontmatter controls who can invoke (`disable-model-invocation`, `user-invocable`)

### 4. `<system-reminder>` Tags

These appear inline in the conversation (not the static system prompt). They inject contextual info like:

- Available skills list
- CLAUDE.md contents
- Current date
- They re-inject after context compaction to preserve critical instructions

### 5. Hooks

Shell commands that fire on lifecycle events (`SessionStart`, `UserPromptSubmit`, etc.). Their stdout can inject text into Claude's context.

### 6. Command-Line Flags (highest priority)

- `--system-prompt` — replaces the entire system prompt
- `--append-system-prompt` — adds to it

## Context Compaction

When the context window fills up, Claude compresses the conversation but **reloads** CLAUDE.md files, auto memory, and skill descriptions so they persist.

## Precedence (highest to lowest)

```
CLI flags > Subagent custom prompt > Hooks > Skills > Org CLAUDE.md
> Project CLAUDE.md > User CLAUDE.md > Project-local > Auto Memory
> On-demand (nested CLAUDE.md, topic files, skill full content)
```

The key design principle: **load descriptions/summaries eagerly, full content lazily** — keeping the baseline context lean while making everything available when needed.
