import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Classmate",
    short_name: "Classmate",
    description: "Study with the students in your class.",
    start_url: "/home",
    display: "standalone",
    background_color: "#eef3fb",
    theme_color: "#1557d6",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
