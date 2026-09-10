/**
 * Pull `@username` handles out of a post / comment / message body.
 * Matches the username rules (3–20 chars, letters/digits/underscore).
 */
const HANDLE_RE = /(?<![\w@])@([a-zA-Z0-9_]{3,20})\b/g;

export function extractHandles(body: string): string[] {
  const out = new Set<string>();
  for (const m of body.matchAll(HANDLE_RE)) {
    out.add(m[1].toLowerCase());
  }
  return [...out];
}
