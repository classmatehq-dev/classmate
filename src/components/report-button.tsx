"use client";

import { useState } from "react";

import { Button, Select, Textarea } from "@/components/ui";
import { useReport } from "@/lib/api/hooks";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "bullying", label: "Bullying or harassment" },
  { value: "cheating", label: "Cheating / test leak" },
  { value: "spam", label: "Spam" },
  { value: "privacy", label: "Privacy issue" },
  { value: "copyright", label: "Copyright issue" },
  { value: "other", label: "Other" },
];

export function ReportButton({
  targetType,
  targetId,
  light,
}: {
  targetType: "post" | "comment" | "profile";
  targetId: string;
  /** styled for a dark/coloured background */
  light?: boolean;
}) {
  const report = useReport();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("inappropriate");
  const [details, setDetails] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <span className={light ? "text-sm text-white/70" : "text-sm text-muted"}>
        Reported — thank you.
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          light
            ? "text-sm font-semibold text-white/70 hover:text-white"
            : "text-sm font-semibold text-muted hover:text-navy"
        }
      >
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-card bg-surface p-5">
            <h3 className="text-lg font-bold text-navy">Report this {targetType}</h3>
            <p className="mt-1 text-sm text-muted">
              Reports are private and reviewed by moderators.
            </p>

            <div className="mt-4 space-y-3">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Add any details (optional)"
                className="min-h-[72px]"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                disabled={report.isPending}
                onClick={async () => {
                  await report.mutateAsync({
                    targetType,
                    targetId,
                    category,
                    details: details.trim() || undefined,
                  });
                  setOpen(false);
                  setDone(true);
                }}
              >
                {report.isPending ? "Sending…" : "Submit report"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
