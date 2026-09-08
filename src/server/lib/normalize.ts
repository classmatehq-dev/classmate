/**
 * Normalization helpers used for dedupe + case-insensitive matching.
 * Stored in the `normalized*` columns by the service layer and the seed script.
 */

/** lowercase, trim, collapse internal whitespace */
export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** normalize a person/display name (same rules, kept separate for intent) */
export function normalizeName(value: string): string {
  return normalizeText(value);
}

/** normalize an optional field to a stable string ("" when absent) */
export function normalizeOptional(value: string | null | undefined): string {
  if (value == null) return "";
  return normalizeText(value);
}

/** collapse a username to its comparison form */
export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}
