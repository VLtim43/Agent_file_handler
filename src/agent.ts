import OpenAI from "openai";
import type { FileEntry, RenameSuggestion } from "./types.js";

function getClient() {
  return new OpenAI({
    apiKey: process.env.LLM_API_KEY ?? "no-key",
    baseURL: process.env.LLM_BASE_URL,
  });
}

const MODEL = process.env.LLM_MODEL ?? "gpt-4o";

function mockSuggestions(files: FileEntry[]): RenameSuggestion[] {
  return files.map((f, i) => ({
    original: f.name,
    suggested: `mock_file_${i + 1}${f.ext}`,
  }));
}

export async function suggestRenames(
  files: FileEntry[],
  instructions: string,
  mock = false
): Promise<RenameSuggestion[]> {
  if (mock) return mockSuggestions(files);
  const fileList = files.map((f) => f.name).join("\n");

  const response = await getClient().chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You are a file renaming assistant.",
          "Given a list of file names and renaming instructions, suggest new names.",
          "Preserve file extensions unless instructed otherwise.",
          'Return ONLY a JSON object with key "suggestions": array of { "original", "suggested" }.',
        ].join(" "),
      },
      {
        role: "user",
        content: `Files:\n${fileList}\n\nInstructions: ${instructions}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from LLM");

  const parsed = JSON.parse(content) as { suggestions: RenameSuggestion[] };
  return parsed.suggestions;
}
