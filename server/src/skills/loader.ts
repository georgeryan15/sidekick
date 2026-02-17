import fs from "fs";
import path from "path";

export interface Skill {
  name: string;
  description: string;
  markdownContent: string;
  scriptsDir: string;
}

const SKILLS_ROOT = path.resolve(__dirname, "../../skills");

function parseFrontmatter(raw: string): {
  attrs: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { attrs: {}, body: raw };

  const attrs: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    attrs[key] = val;
  }
  return { attrs, body: match[2] };
}

export function loadSkills(): Skill[] {
  if (!fs.existsSync(SKILLS_ROOT)) return [];

  const skills: Skill[] = [];

  for (const dir of fs.readdirSync(SKILLS_ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;

    const skillDir = path.join(SKILLS_ROOT, dir.name);
    const mdPath = path.join(skillDir, "SKILL.md");
    if (!fs.existsSync(mdPath)) continue;

    // Load optional .env
    const envPath = path.join(skillDir, ".env");
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        process.env[key] = val;
      }
    }

    const raw = fs.readFileSync(mdPath, "utf-8");
    const { attrs, body } = parseFrontmatter(raw);

    const scriptsDir = path.join(skillDir, "scripts");
    const markdownContent = body.replace(/\{baseDir\}/g, skillDir);

    skills.push({
      name: attrs.name || dir.name,
      description: attrs.description || "",
      markdownContent,
      scriptsDir,
    });
  }

  return skills;
}
