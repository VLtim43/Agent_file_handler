const ESC = "\x1b";

export const c = {
  red:    (s: string) => `${ESC}[31m${s}${ESC}[0m`,
  green:  (s: string) => `${ESC}[32m${s}${ESC}[0m`,
  yellow: (s: string) => `${ESC}[33m${s}${ESC}[0m`,
  cyan:   (s: string) => `${ESC}[36m${s}${ESC}[0m`,
  dim:    (s: string) => `${ESC}[2m${s}${ESC}[0m`,
  bold:   (s: string) => `${ESC}[1m${s}${ESC}[0m`,
};

/** Highlights changed characters: red in original, green in suggested. */
export function diffName(original: string, suggested: string): string {
  if (original === suggested) return c.dim(original) + " → " + c.dim(suggested);

  // Find common prefix and suffix, highlight the changed middle
  let pre = 0;
  while (pre < original.length && pre < suggested.length && original[pre] === suggested[pre]) pre++;

  let sufO = original.length;
  let sufS = suggested.length;
  while (sufO > pre && sufS > pre && original[sufO - 1] === suggested[sufS - 1]) { sufO--; sufS--; }

  const origFormatted =
    c.dim(original.slice(0, pre)) +
    c.red(original.slice(pre, sufO)) +
    c.dim(original.slice(sufO));

  const sugFormatted =
    c.dim(suggested.slice(0, pre)) +
    c.green(suggested.slice(pre, sufS)) +
    c.dim(suggested.slice(sufS));

  return origFormatted + " → " + sugFormatted;
}

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** Shows a spinner on stderr. Returns a stop function. */
export function spinner(message: string): () => void {
  let i = 0;
  process.stderr.write("\x1b[?25l"); // hide cursor
  const id = setInterval(() => {
    process.stderr.write(`\r${c.cyan(FRAMES[i++ % FRAMES.length])} ${message}`);
  }, 80);

  return () => {
    clearInterval(id);
    process.stderr.write(`\r\x1b[K\x1b[?25h`); // clear line, show cursor
  };
}
