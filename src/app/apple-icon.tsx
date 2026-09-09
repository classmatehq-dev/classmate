import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1557D6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 48 48" fill="none">
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
      </div>
    ),
    size,
  );
}
