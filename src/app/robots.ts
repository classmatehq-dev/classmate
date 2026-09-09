import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup"],
      // Everything behind auth or that isn't a real landing page.
      disallow: [
        "/api/",
        "/home",
        "/discover",
        "/leaderboard",
        "/profile",
        "/create",
        "/onboarding/",
        "/class/",
        "/post/",
        "/classes/",
        "/u/",
      ],
    },
    sitemap: "https://useclassmate.com/sitemap.xml",
    host: "https://useclassmate.com",
  };
}
