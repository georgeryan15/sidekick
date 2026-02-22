import { tool } from "@openai/agents";
import { z } from "zod";
import { requestClientExec } from "../ws";

export const localExecTool = tool({
  name: "localExec",
  description:
    "Execute a shell command on the user's local machine via Electron. Use for file operations, git, opening local apps, and anything requiring the user's filesystem.",
  parameters: z.object({
    command: z
      .string()
      .describe("The shell command to run on the user's local machine"),
  }),
  execute: async ({ command }) => {
    console.log(`[localExec] ${command}`);
    return requestClientExec(command);
  },
});
