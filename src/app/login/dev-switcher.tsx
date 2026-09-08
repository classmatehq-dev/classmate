"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { setDevAccount } from "@/lib/dev-account";

const ACCOUNTS = [
  { id: "dev_seed_sarah", label: "Sarah (demo)" },
  { id: "dev_seed_jacob", label: "Jacob (demo)" },
  { id: "dev_seed_maria", label: "Maria (demo)" },
  { id: "dev_local", label: "My local account" },
];

export function DevAccountSwitcher() {
  const router = useRouter();
  const [custom, setCustom] = useState("");

  function switchTo(id: string) {
    setDevAccount(id);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-card border border-dashed border-border bg-surface p-5">
      <p className="text-sm font-semibold text-navy">Switch dev account</p>
      <p className="mt-0.5 text-xs text-muted">
        For testing multiple students. Not shown in production.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {ACCOUNTS.map((a) => (
          <button
            key={a.id}
            onClick={() => switchTo(a.id)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-navy hover:bg-light-blue"
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="new-account-id"
          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
        />
        <button
          onClick={() => custom.trim() && switchTo(`dev_${custom.trim()}`)}
          className="rounded-xl bg-brand-blue px-3 py-2 text-sm font-semibold text-white"
        >
          Go
        </button>
      </div>
    </div>
  );
}
