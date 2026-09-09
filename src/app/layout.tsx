import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { Providers } from "@/components/providers";
import { authDevBypass } from "@/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = "https://useclassmate.com";
const TITLE = "Classmate — study with the students in your class";
const DESCRIPTION =
  "Classmate connects you with the students in your exact class — same school, same teacher, same course. Share notes, ask questions, and learn together.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Classmate",
  },
  description: DESCRIPTION,
  applicationName: "Classmate",
  keywords: [
    "classmate",
    "study with classmates",
    "class notes",
    "homework help",
    "study group",
    "school",
    "high school",
    "college",
    "flashcards",
    "ask a question",
  ],
  authors: [{ name: "Classmate" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Classmate",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1557d6",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const tree = (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );

  // ClerkProvider requires publishable key; only mount it when Clerk is on.
  return authDevBypass ? tree : <ClerkProvider>{tree}</ClerkProvider>;
}
