/**
 * Classmate mark: a C-shaped speech bubble.
 * `size` controls the square glyph; the wordmark is optional.
 */
export function Logo({
  size = 40,
  withWordmark = false,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className ?? ""}`}
      aria-label="Classmate"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        <rect width="48" height="48" rx="12" fill="var(--color-brand-blue)" />
        <path
          d="M33 17.5a11 11 0 1 0 0 13"
          stroke="#fff"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="33" cy="33" r="3.5" fill="var(--color-accent-yellow)" />
      </svg>
      {withWordmark && (
        <span className="text-xl font-bold tracking-tight text-navy">
          Classmate
        </span>
      )}
    </span>
  );
}
