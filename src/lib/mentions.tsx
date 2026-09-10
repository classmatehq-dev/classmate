import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Render a post/comment body with `@username` turned into profile links.
 * Only handles that the server resolved to real class members (passed in
 * `mentions`, as canonical usernames) become links.
 */
export function renderBody(body: string, mentions: string[]): ReactNode {
  if (!mentions || mentions.length === 0) return body;

  const canonicalByLower = new Map(
    mentions.map((m) => [m.toLowerCase(), m]),
  );
  const parts = body.split(/(@[a-zA-Z0-9_]{3,20})/g);

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const canonical = canonicalByLower.get(part.slice(1).toLowerCase());
      if (canonical) {
        return (
          <Link
            key={i}
            href={`/u/${canonical}`}
            className="font-semibold text-brand-blue hover:underline"
          >
            @{canonical}
          </Link>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}
