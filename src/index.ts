import { createInterface } from "node:readline/promises";
import { resolve } from "node:path";
import { program } from "commander";
import { scanDirectory } from "./scanner.js";
import { suggestRenames } from "./agent.js";
import { applyRenames } from "./renamer.js";

program
  .name("afh")
  .description("Agent-powered file handler")
  .version("0.1.0");

program
  .command("rename <folder>")
  .description("Use an LLM to suggest and apply file renames")
  .option("-t, --context <info>", "Extra context injected into the agent prompt")
  .option("--mock", "Skip the API and use mock suggestions (for testing)")
  .action(async (folder: string, opts: { context?: string; mock: boolean }) => {
    const folderPath = resolve(folder);

    console.log(`\nScanning: ${folderPath}`);
    const files = scanDirectory(folderPath);

    if (files.length === 0) {
      console.log("No files found.");
      return;
    }

    console.log(`Found ${files.length} file(s):`);
    files.forEach((f) => console.log(`  ${f.name}`));

    console.log("\nAsking agent for suggestions...");
    const suggestions = await suggestRenames(files, opts.context ?? "", opts.mock);

    console.log("\nSuggested renames:");
    suggestions.forEach(({ original, suggested }) =>
      console.log(`  ${original} → ${suggested}`)
    );

    if (opts.mock) {
      console.log("\n(mock mode — no files were changed)");
      return;
    }

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question("\nApply these renames? [y/N] ");
    rl.close();

    if (answer.toLowerCase() !== "y") {
      console.log("Aborted.");
      return;
    }

    applyRenames(folderPath, suggestions);
    console.log("\nDone.");
  });

program.parse();
