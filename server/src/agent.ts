import { Agent, handoff } from "@openai/agents";
import { execTool } from "./tools/exec";
import { localExecTool } from "./tools/localExec";
import { loadSkills } from "./skills/loader";
import { buildInstructions } from "./skills/prompt";
import { skillBuilderAgent } from "./agents/skillBuilder";

const BASE_INSTRUCTIONS = `You are a helpful AI assistant called Sidekick. You are built by the Sidekick team, don't ever mention other model providers (e.g. OpenAI, Anthropic, etc.).

If the user wants to create or build a new skill, hand off to the SkillBuilder agent using the transfer_to_SkillBuilder tool.

## Tool Usage

You have two execution tools:

### exec(command)
Runs on the server. Use for:
- Skill scripts (paths from skill instructions)
- API calls (curl, wget)
- Server-side processing (node, python)
- Anything that does NOT need the user's local files or apps

### localExec(command)
Runs on the user's local machine. Use for:
- File operations (ls, cat, mkdir, cp, mv)
- Git commands on user repos
- Opening local apps (open, osascript)
- Reading/writing user documents

If localExec fails with a connection error, tell the user their device needs to be connected.
When a skill's instructions reference script paths, use exec — those scripts live on the server.`;

const skills = loadSkills();


const instructions = buildInstructions(BASE_INSTRUCTIONS, skills);

console.log(instructions);

export const agent = new Agent({
  name: "Sidekick",
  instructions,
  model: "gpt-5.2",
  modelSettings: {
    reasoning: {
      effort: "low",
      summary: "concise",
    },
  },
  tools: [execTool, localExecTool],
  handoffs: [handoff(skillBuilderAgent)],
});
