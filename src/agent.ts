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
  mock = false,
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
          "Given a list of file names and renaming instructions, suggest new names following these rules:",
          "1. Remove or replace any invalid/special characters (spaces, accents, symbols like !@#$%^&*()[]{}|\\<>?'\"`~) — use underscores or hyphens instead.",
          "2. Rename files with generic or auto-generated names (e.g. '1.png', 'image001.jpg', 'banana(2).png', 'untitled.pdf', 'document(3).docx', 'file_copy.txt') to a random 8-character alphanumeric string (e.g. 'a3f9kx2m.png'). Do NOT try to invent a descriptive name for these — just use a random string.",
          "3. Preserve file extensions unless instructed otherwise.",
          "4. Use lowercase letters and underscores or hyphens only (no spaces).",
          "5. Keep names concise but meaningful.",
          'Return ONLY a JSON object with key "suggestions": array of { "original", "suggested" }.',
        ].join(" "),
      },
      {
        role: "user",
        content: instructions
          ? `Files:\n${fileList}\n\nExtra context: ${instructions}`
          : `Files:\n${fileList}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from LLM");

  let parsed: { suggestions: RenameSuggestion[] };
  try {
    parsed = JSON.parse(content) as { suggestions: RenameSuggestion[] };
  } catch {
    const err: any = new Error("Failed to parse LLM response as JSON");
    err.raw = content;
    throw err;
  }

  if (!Array.isArray(parsed.suggestions)) {
    const err: any = new Error('LLM response missing "suggestions" array');
    err.raw = content;
    throw err;
  }

  return parsed.suggestions;
}
