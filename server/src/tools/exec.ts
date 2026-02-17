import { tool } from "@openai/agents";
import { z } from "zod";
import { requestClientExec } from "../ws";

export const execTool = tool({
  name: "exec",
  description:
    "Execute any shell command on the host machine. You have full access to run any command (e.g. ping, curl, ls, cat, npm, git, etc.).",
  parameters: z.object({
    command: z
      .string()
      .describe("The shell command to run (e.g. 'ping -c 4 google.com', 'ls -la', 'curl https://example.com')"),
  }),
  execute: async ({ command }) => {
    return requestClientExec(command);
  },
});
