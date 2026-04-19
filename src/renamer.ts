import { renameSync } from "node:fs";
import { join, dirname } from "node:path";
import type { RenameSuggestion } from "./types.js";

export function applyRenames(
  folderPath: string,
  suggestions: RenameSuggestion[]
): void {
  for (const { original, suggested } of suggestions) {
    const from = join(folderPath, original);
    const to = join(folderPath, suggested);
    renameSync(from, to);
    console.log(`  ${original} → ${suggested}`);
  }
}
