"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AccountControl } from "@/components/account-control";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";
import { Avatar, cx } from "@/components/ui";
import { useNotificationsUnreadCount, useUnreadCount } from "@/lib/api/hooks";

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
    href: "/messages",
    label: "Messages",
    icon: icon("M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z"),
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: icon("M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9|M13.73 21a2 2 0 0 1-3.46 0"),
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
  const unread = useUnreadCount();
  const unreadCount = unread.data?.count ?? 0;
  const notifs = useNotificationsUnreadCount();
  const notifCount = notifs.data?.count ?? 0;
  const isActive = (href: string) =>
    href === "/profile"
      ? pathname === "/profile" || pathname === `/u/${username}`
      : pathname === href || pathname.startsWith(`${href}/`);

  // Messages + Notifications live in the mobile top bar, not the bottom nav.
  const bottomNavItems = items.filter(
    (i) => i.href !== "/messages" && i.href !== "/notifications",
  );
  const badgeFor = (href: string) =>
    href === "/messages" ? unreadCount : href === "/notifications" ? notifCount : 0;

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
              {badgeFor(item.href) > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1.5 text-xs font-bold text-white">
                  {badgeFor(item.href) > 9 ? "9+" : badgeFor(item.href)}
                </span>
              )}
            </Link>
          ),
        )}

        <div className="mt-auto space-y-3 border-t border-border px-3 pt-4">
          <Link
            href={`/u/${username}`}
            className="flex items-center gap-2.5 rounded-pill px-1 py-1 hover:bg-light-blue/60"
          >
            <Avatar username={username} size={32} />
            <span className="truncate text-sm font-bold text-navy">
              @{username}
            </span>
          </Link>
          <AccountControl authMode={authMode} className="px-2 text-sm font-semibold text-muted hover:text-navy" />
        </div>
      </nav>

      {/* Mobile top bar — fixed so it never becomes a flex sibling of content */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-2.5 backdrop-blur md:hidden">
        <Logo size={26} withWordmark />
        <div className="flex items-center gap-1">
          <Link
            href="/messages"
            aria-label="Messages"
            className={cx(
              "relative rounded-full p-2",
              isActive("/messages")
                ? "text-brand-blue"
                : "text-navy hover:bg-light-blue",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-blue px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <NotificationBell />
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {bottomNavItems.map((item) =>
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
