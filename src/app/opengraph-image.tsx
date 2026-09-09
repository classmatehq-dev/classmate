import { ImageResponse } from "next/og";

export const alt = "Classmate — study with the students in your class";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #1249b5 0%, #1557d6 45%, #3d7bf0 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 46,
            fontWeight: 800,
          }}
        >
          <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
            <path
              d="M34.5 11.5A16 16 0 1 0 34.5 34"
              stroke="#fff"
              strokeWidth="7.5"
              strokeLinecap="round"
            />
            <path d="M19 33.5 10 44l14-4.2z" fill="#fff" />
            <circle cx="19.6" cy="16" r="4.3" fill="#fff" />
          <path d="M11.8 31c0-6.2 3.5-9.8 7.8-9.8s7.8 3.6 7.8 9.8z" fill="#fff" />
            <circle cx="27.6" cy="19" r="3.7" fill="#FFC928" />
          <path d="M21.3 32c0-5.4 2.8-8.5 6.3-8.5s6.3 3.1 6.3 8.5z" fill="#FFC928" />
          </svg>
          Classmate
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Learn from your class.
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            color: "rgba(255,255,255,0.85)",
            maxWidth: 900,
          }}
        >
          Notes, questions and study material from the students in your exact
          class.
        </div>
      </div>
    ),
    size,
  );
}
