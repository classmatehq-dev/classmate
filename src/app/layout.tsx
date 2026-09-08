import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { Providers } from "@/components/providers";
import { authDevBypass } from "@/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Classmate — Learn from your class",
  description:
    "Find notes, questions, discussions, and study material from students in your classes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const tree = (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );

  // ClerkProvider requires publishable key; only mount it when Clerk is on.
  return authDevBypass ? tree : <ClerkProvider>{tree}</ClerkProvider>;
}
