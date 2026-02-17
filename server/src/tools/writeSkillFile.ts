import { tool } from "@openai/agents";
import { z } from "zod";
import fs from "fs";
import path from "path";

const SKILLS_ROOT = path.resolve(__dirname, "../../skills");

export const writeSkillFile = tool({
  name: "write_skill_file",
  description:
    "Write a file into a skill directory under server/skills/<skillName>/. Use this to create SKILL.md files, shell scripts, and other skill assets.",
  parameters: z.object({
    skillName: z
      .string()
      .describe("Name of the skill (becomes the directory name under server/skills/)"),
    filePath: z
      .string()
      .describe(
        "Path relative to the skill directory, e.g. 'SKILL.md' or 'scripts/myscript.sh'"
      ),
    content: z.string().describe("The file content to write"),
    executable: z
      .boolean()
      .default(false)
      .describe("Set to true to make the file executable (chmod +x)"),
  }),
  execute: async ({ skillName, filePath, content, executable }) => {
    const skillDir = path.resolve(SKILLS_ROOT, skillName);
    const fullPath = path.resolve(skillDir, filePath);

    // Ensure the resolved path is inside the skill directory
    if (!fullPath.startsWith(skillDir + path.sep) && fullPath !== skillDir) {
      return `Error: path "${filePath}" resolves outside the skill directory.`;
    }

    // Create parent directories as needed
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    fs.writeFileSync(fullPath, content, "utf-8");

    if (executable) {
      fs.chmodSync(fullPath, 0o755);
    }

    return `Wrote ${fullPath}${executable ? " (executable)" : ""}`;
  },
});
