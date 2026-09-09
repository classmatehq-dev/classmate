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

      {/* back classmate — head + shoulders, connected */}
      <circle cx="19.6" cy="16" r="4.3" fill={back} />
      <path
        d="M11.8 31c0-6.2 3.5-9.8 7.8-9.8s7.8 3.6 7.8 9.8z"
        fill={back}
      />

      {/* front classmate (gold) */}
      <circle cx="27.6" cy="19" r="3.7" fill={front} />
      <path
        d="M21.3 32c0-5.4 2.8-8.5 6.3-8.5s6.3 3.1 6.3 8.5z"
        fill={front}
      />
    </svg>
  );
}
