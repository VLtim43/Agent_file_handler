import { readdirSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";
import type { FileEntry } from "./types.js";

export function scanDirectory(folderPath: string): FileEntry[] {
  const entries = readdirSync(folderPath);

  return entries
    .filter((name) => statSync(join(folderPath, name)).isFile())
    .map((name) => ({
      name,
      path: join(folderPath, name),
      ext: extname(name),
    }));
}
