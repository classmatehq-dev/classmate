/** Opaque keyset-pagination cursor: `{ t: ISO timestamp, id: uuid }`. */

export type Cursor = { t: string; id: string };

export function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c), "utf8").toString("base64url");
}

export function decodeCursor(raw: string | undefined | null): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      parsed &&
      typeof parsed.t === "string" &&
      typeof parsed.id === "string"
    ) {
      return { t: parsed.t, id: parsed.id };
    }
  } catch {
    /* fall through */
  }
  return null;
}
