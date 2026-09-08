"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AccountControl } from "@/components/account-control";
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

export function AppNav({
  username,
  authMode,
}: {
  username: string;
  authMode: "dev" | "clerk";
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/profile"
      ? pathname === "/profile" || pathname === `/u/${username}`
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 py-6 md:flex">
        <Link href="/home" className="mb-5 px-3">
          <Logo size={32} withWordmark />
        </Link>

        {items.map((item) =>
          item.emphasized ? (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "my-1.5 flex items-center gap-2 rounded-pill bg-brand-blue px-4 py-3 text-[15px] font-bold text-white shadow-blue transition-colors hover:bg-brand-blue-600",
                isActive(item.href) && "ring-2 ring-brand-blue/30",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "relative flex items-center gap-3 rounded-pill px-3 py-2.5 text-[15px] font-semibold transition-colors",
                isActive(item.href)
                  ? "bg-light-blue text-brand-blue"
                  : "text-navy hover:bg-light-blue/60",
              )}
            >
              {isActive(item.href) && (
                <span className="absolute -left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-pill bg-brand-blue" />
              )}
              {item.icon}
              {item.label}
            </Link>
          ),
        )}

        <div className="mt-auto px-3 pt-4">
          <AccountControl authMode={authMode} />
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
        <Logo size={28} withWordmark />
        <NotificationBell />
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {items.map((item) =>
          item.emphasized ? (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center"
              aria-label={item.label}
            >
              <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue text-white shadow-blue ring-4 ring-background">
                {item.icon}
              </span>
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors",
                isActive(item.href) ? "text-brand-blue" : "text-muted",
              )}
            >
              <span
                className={cx(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  isActive(item.href) && "bg-light-blue",
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          ),
        )}
      </nav>
    </>
  );
}
