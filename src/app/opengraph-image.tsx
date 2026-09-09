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
            <circle cx="20.5" cy="17.4" r="3.7" fill="#fff" />
            <path d="M13.6 30.5a6.9 6.9 0 0 0 13.8 0z" fill="#fff" />
            <circle cx="27.4" cy="20.2" r="3.2" fill="#FFC928" />
            <path d="M21.4 31.5a6 6 0 0 0 12 0z" fill="#FFC928" />
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
