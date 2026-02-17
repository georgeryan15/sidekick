# Markdown Specs Evaluation

Evaluating whether to replace JSON spec files with markdown files (like OpenClaw's SKILL.md approach) for defining API integrations.

Reference: [OpenClaw Attio SKILL.md](https://github.com/openclaw/skills/blob/main/skills/andrewdmwalker/attio/SKILL.md)

## Overview

**Yes, it's absolutely possible.** The system could replace JSON spec files with markdown files that describe the API in natural language. Instead of programmatically parsing specs into Zod schemas and registering tools, the markdown would be injected into the agent's system prompt and the AI would construct the HTTP requests itself. The executor would become a generic "make this HTTP request" tool rather than a spec-specific proxy.

The OpenClaw approach essentially says: "The LLM is smart enough to read API docs and figure out the request format — no schema layer needed."

## Pros

- **Complex types are free** — Arrays, nested objects, polymorphic fields all just work. The LLM reads "messages is an array of `{role, content}` objects" and builds it correctly. The current blocker disappears entirely.
- **Simpler architecture** — Eliminates `types.ts`, the Zod schema builder in `tools.ts`, `validator.ts`, and most of `loader.ts`. Far less code to maintain.
- **Easier to author** — Anyone can write a markdown file describing an API. No need to understand a custom JSON schema format.
- **Flexibility** — Can include examples, edge cases, caveats, rate limit notes — context that a JSON schema can't express.
- **Faster iteration** — Edit a `.md` file, restart, done. No worrying about type mismatches or schema validation failures.

## Cons

- **No compile-time guarantees** — The JSON spec system catches errors early (missing required fields, wrong types). Markdown relies entirely on the LLM interpreting things correctly every time.
- **Token cost** — Markdown API docs are verbose. Every request to the LLM includes the full spec text in the system prompt, burning tokens whether or not that integration is used.
- **Non-determinism** — The LLM might format a request slightly differently each time (e.g., wrong content-type, missing header, extra fields). JSON schemas enforce exact structure.
- **No tooling integration** — OpenAI's tool/function-calling gives the AI a structured way to invoke actions with validated parameters. With markdown, a generic "http_request" tool is needed and the LLM must build correct requests — losing the guardrails.
- **Harder to debug** — When a call fails, it's unclear if it's the API or the LLM misreading the spec. With JSON schemas, if validation passes, the request shape is known to be correct.
- **Security surface** — A generic HTTP tool means the LLM could theoretically make requests to any URL, not just declared endpoints. The JSON spec approach constrains it to declared endpoints.

## Summary

The markdown approach would solve the immediate problem (complex types) and simplify authoring, but at the cost of reliability, security, and token efficiency. The JSON spec approach is more rigid but safer and cheaper. A **hybrid** might be the sweet spot — keep structured specs for the tool registration and validation layer, but add support for `array`/`object` types so you get the best of both worlds. That said, if speed of integration and flexibility matter more than strictness, the markdown approach is viable.
