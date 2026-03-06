import { tool } from "@openai/agents";
import { z } from "zod";
import { requestClientExec } from "../ws";

export const execTool = tool({
  name: "exec",
  description:
    "Execute a shell command on the user's machine. Use for file operations, git, running scripts, API calls, and all shell commands.",
  parameters: z.object({
    command: z
      .string()
      .describe("The shell command to run"),
  }),
  execute: async ({ command }) => {
    console.log(`[exec] ${command}`);
    return requestClientExec(command);
  },
});
