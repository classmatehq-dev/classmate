"use client";

import { useEffect, useRef, useState } from "react";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="rounded-full p-2 text-navy hover:bg-light-blue"
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
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-card border border-border bg-surface p-4 shadow-lg">
          <p className="text-sm font-semibold text-navy">Notifications</p>
          <p className="mt-1 text-sm text-muted">
            You&apos;re all caught up. Alerts for new posts, comments, replies,
            and follows are coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
