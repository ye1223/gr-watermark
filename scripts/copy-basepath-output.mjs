import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const outputDir = "out";
const baseSegment = "gr-watermark";
const targetDir = join(outputDir, baseSegment);

if (!existsSync(outputDir)) {
  throw new Error(`Missing ${outputDir}; run next build first.`);
}

rmSync(targetDir, { force: true, recursive: true });
mkdirSync(targetDir, { recursive: true });

for (const entry of readdirSync(outputDir)) {
  if (entry === baseSegment) continue;
  cpSync(join(outputDir, entry), join(targetDir, entry), { recursive: true });
}

console.log(`Copied static export into ${targetDir}`);
