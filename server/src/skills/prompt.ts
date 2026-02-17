import { Skill } from "./loader";

export function buildInstructions(
  baseInstructions: string,
  skills: Skill[]
): string {
  if (skills.length === 0) return baseInstructions;

  const skillBlocks = skills
    .map(
      (s) =>
        `  <skill name="${s.name}">\n${s.markdownContent.trim()}\n  </skill>`
    )
    .join("\n\n");

  return `${baseInstructions}

<available_skills>
${skillBlocks}
</available_skills>`;
}
