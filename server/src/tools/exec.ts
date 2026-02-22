import { tool } from "@openai/agents";
import { z } from "zod";
import { exec as cpExec } from "child_process";

export const execTool = tool({
  name: "exec",
  description:
    "Execute a shell command on the server. Use for API calls, skill scripts, and anything that doesn't need the user's local machine.",
  parameters: z.object({
    command: z
      .string()
      .describe("The shell command to run on the server"),
  }),
  execute: async ({ command }) => {
    console.log(`[exec] ${command}`);
    return new Promise<string>((resolve) => {
      cpExec(command, { timeout: 30_000 }, (error, stdout, stderr) => {
        if (error) {
          resolve(`Error: ${error.message}\n${stderr}`.trim());
          return;
        }
        resolve(stdout || stderr || "(no output)");
      });
    });
  },
});
