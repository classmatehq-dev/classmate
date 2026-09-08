/**
 * Deterministic "subject colour" for a class, keyed off its id — so the same
 * class always gets the same colour, like class cards in Google Classroom.
 *
 * Classmate palette: shades of blue, with gold as the single warm accent.
 */

export type ClassColor = {
  /** solid accent (headers, stripes, text on light) */
  accent: string;
  /** tinted surface for card backgrounds */
  bg: string;
  /** readable text colour on the tinted surface */
  text: string;
};

const PALETTE: ClassColor[] = [
  { accent: "#1557d6", bg: "#e7f0ff", text: "#0f3c96" }, // brand blue
  { accent: "#0b1f44", bg: "#e5eaf4", text: "#0b1f44" }, // navy
  { accent: "#2f80ed", bg: "#e3f0ff", text: "#1a5cb8" }, // sky
  { accent: "#3b4fd8", bg: "#e8eaff", text: "#2a37a8" }, // indigo
  { accent: "#0e7490", bg: "#dff4fb", text: "#0b5a72" }, // teal-blue
  { accent: "#a86616", bg: "#fff3d6", text: "#7c4a0f" }, // gold accent
];

export function classColor(id: string): ClassColor {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
