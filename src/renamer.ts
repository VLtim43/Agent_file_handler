import { renameSync } from "node:fs";
import { join } from "node:path";
import type { RenameSuggestion } from "./types.js";
import { c, diffName } from "./ui.js";

export function applyRenames(
  folderPath: string,
  suggestions: RenameSuggestion[]
): void {
  for (const { original, suggested } of suggestions) {
    const from = join(folderPath, original);
    const to = join(folderPath, suggested);
    try {
      renameSync(from, to);
      console.log("  " + diffName(original, suggested) + c.green(" ✓"));
    } catch (err: any) {
      console.error("  " + c.red(`Failed to rename ${original}: `) + err.message);
    }
  }
}
