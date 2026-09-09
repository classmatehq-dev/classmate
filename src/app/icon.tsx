import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1557D6",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
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
      </div>
    ),
    size,
  );
}
