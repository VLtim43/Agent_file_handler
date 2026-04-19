import { createInterface } from "node:readline/promises";
import { resolve } from "node:path";
import { program } from "commander";
import { scanDirectory } from "./scanner.js";
import { suggestRenames } from "./agent.js";
import { applyRenames } from "./renamer.js";
import { spinner, diffName, c } from "./ui.js";
import type { FileEntry } from "./types.js";

program
  .name("afh")
  .description("Agent-powered file handler")
  .version("0.1.0");

program
  .command("rename <folder>")
  .description("Use an LLM to suggest and apply file renames")
  .option("-t, --context <info>", "Extra context injected into the agent prompt")
  .option("-b, --batch <n>", "Process files in batches of N", parseInt)
  .option("--mock", "Skip the API and use mock suggestions (for testing)")
  .action(async (folder: string, opts: { context?: string; mock: boolean; batch?: number }) => {
    const folderPath = resolve(folder);

    console.log(`\n${c.dim("Scanning:")} ${folderPath}`);
    const files = scanDirectory(folderPath);

    if (files.length === 0) {
      console.log(c.yellow("No files found."));
      return;
    }

    const batchSize = opts.batch && opts.batch > 0 ? opts.batch : files.length;
    const batches: FileEntry[][] = [];
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }

    const total = files.length;
    const totalBatches = batches.length;
    console.log(`\n${c.bold(`Found ${total} file(s)`)}${totalBatches > 1 ? c.dim(` — ${totalBatches} batches of ${batchSize}`) : ""}`);

    const rl = createInterface({ input: process.stdin, output: process.stdout });

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      const isLastBatch = batchIdx === batches.length - 1;

      if (totalBatches > 1) {
        const start = batchIdx * batchSize + 1;
        const end = start + batch.length - 1;
        console.log(`\n${c.bold(c.cyan(`── Batch ${batchIdx + 1}/${totalBatches} (files ${start}–${end}) ──`))}`);
      }

      console.log();
      batch.forEach((f) => console.log(`  ${c.dim(f.name)}`));

      if (!opts.mock) {
        const confirm = await rl.question(c.cyan("\nSend this batch to AI? [y/N/q] "));
        if (confirm.toLowerCase() === "q") { console.log(c.yellow("Stopped.")); break; }
        if (confirm.toLowerCase() !== "y") { console.log(c.dim("Skipped.")); continue; }
      }

      const stop = opts.mock ? null : spinner("Waiting for AI response...");
      let suggestions;
      try {
        suggestions = await suggestRenames(batch, opts.context ?? "", opts.mock);
      } catch (err: any) {
        stop?.();
        console.error(c.red("\nAgent error: ") + (err?.message ?? err));
        if (err?.raw) console.error(c.dim("Raw response: ") + err.raw);

        if (!isLastBatch) {
          const answer = await rl.question(c.yellow("Continue to next batch? [y/N] "));
          if (answer.toLowerCase() !== "y") break;
        }
        continue;
      }
      stop?.();

      console.log(`\n${c.bold("Suggested renames:")}`);
      suggestions.forEach(({ original, suggested }) =>
        console.log("  " + diffName(original, suggested))
      );

      if (opts.mock) {
        if (!isLastBatch) console.log(c.dim("\n(mock mode — skipping to next batch)"));
        else console.log(c.dim("\n(mock mode — no files were changed)"));
        continue;
      }

      const answer = await rl.question("\nApply these renames? [y/N/q] ");
      if (answer.toLowerCase() === "q") {
        console.log(c.yellow("Stopped."));
        break;
      }
      if (answer.toLowerCase() !== "y") {
        console.log(c.dim("Skipped."));
        continue;
      }

      applyRenames(folderPath, suggestions);

      if (!isLastBatch) console.log(c.green("Applied. Moving to next batch..."));
      else console.log(c.green("\nDone."));
    }

    rl.close();
  });

program.parse();
