"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";
import { cx } from "@/components/ui";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
  emphasized?: boolean;
};

function icon(path: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      {path.split("|").map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

const items: Item[] = [
  { href: "/home", label: "Home", icon: icon("M3 10.5 12 4l9 6.5|M5 9.5V20h14V9.5") },
  {
    href: "/discover",
    label: "Discover",
    icon: icon("M21 21l-4.3-4.3|M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"),
  },
  {
    href: "/create",
    label: "Create",
    icon: icon("M12 5v14|M5 12h14"),
    emphasized: true,
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: icon("M6 21V10|M12 21V4|M18 21v-7"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: icon("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z|M4 21c0-4 4-6 8-6s8 2 8 6"),
  },
];

export function AppNav({ username }: { username: string }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/profile"
      ? pathname === "/profile" || pathname === `/u/${username}`
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-1 py-6 md:flex">
        <Link href="/home" className="mb-4 px-3">
          <Logo size={32} withWordmark />
        </Link>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "flex items-center gap-3 rounded-pill px-3 py-2.5 text-[15px] font-semibold transition-colors",
              isActive(item.href)
                ? "bg-light-blue text-brand-blue"
                : "text-navy hover:bg-light-blue/60",
              item.emphasized && !isActive(item.href) && "text-brand-blue",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <Logo size={28} withWordmark />
        <NotificationBell />
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-border bg-surface md:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              isActive(item.href) ? "text-brand-blue" : "text-muted",
            )}
          >
            <span
              className={cx(
                item.emphasized &&
                  "rounded-full bg-brand-blue p-1.5 text-white",
              )}
            >
              {item.icon}
            </span>
            {!item.emphasized && item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
