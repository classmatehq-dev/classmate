/**
 * Classmate mark: a C-shaped speech bubble with two classmates inside
 * (one blue, one gold). `withWordmark` adds the "Classmate" text.
 * `tone="white"` renders a version for dark / coloured backgrounds.
 */
export function Logo({
  size = 40,
  withWordmark = false,
  tone = "color",
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  tone?: "color" | "white";
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className ?? ""}`}
      aria-label="Classmate"
    >
      <LogoMark size={size} tone={tone} />
      {withWordmark && (
        <span
          className={`font-extrabold tracking-tight ${
            tone === "white" ? "text-white" : "text-navy"
          }`}
          style={{ fontSize: size * 0.62 }}
        >
          Classmate
        </span>
      )}
    </span>
  );
}

export function LogoMark({
  size = 40,
  tone = "color",
}: {
  size?: number;
  tone?: "color" | "white";
}) {
  const c = tone === "white" ? "#ffffff" : "#1557D6";
  const back = tone === "white" ? "#ffffff" : "#1557D6";
  const front = "#FFC928";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden
    >
      {/* C-shaped speech bubble */}
      <path
        d="M34.5 11.5A16 16 0 1 0 34.5 34"
        stroke={c}
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      {/* speech-bubble tail */}
      <path d="M19 33.5 10 44l14-4.2z" fill={c} />

      {/* back classmate */}
      <circle cx="20.5" cy="17.4" r="3.7" fill={back} />
      <path d="M13.6 30.5a6.9 6.9 0 0 0 13.8 0z" fill={back} />

      {/* front classmate (gold) */}
      <circle cx="27.4" cy="20.2" r="3.2" fill={front} />
      <path d="M21.4 31.5a6 6 0 0 0 12 0z" fill={front} />
    </svg>
  );
}
