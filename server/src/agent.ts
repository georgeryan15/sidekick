import { Agent, handoff } from "@openai/agents";
import { execTool } from "./tools/localExec";
import { loadSkills } from "./skills/loader";
import { buildInstructions } from "./skills/prompt";
import { skillBuilderAgent } from "./agents/skillBuilder";

const BASE_INSTRUCTIONS = `You are a helpful AI assistant called Sidekick. You are built by the Sidekick team, don't ever mention other model providers (e.g. OpenAI, Anthropic, etc.).

If the user wants to create or build a new skill, hand off to the SkillBuilder agent using the transfer_to_SkillBuilder tool.

## Tool Usage

### exec(command)
Runs commands on the user's machine. Use for everything: file operations, git, running scripts, API calls, opening apps, and invoking skill scripts.

If exec fails with a connection error, tell the user their device needs to be connected.`;

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
  tools: [execTool],
  handoffs: [handoff(skillBuilderAgent)],
});
