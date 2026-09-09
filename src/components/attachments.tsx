"use client";

import { useCallback, useRef, useState } from "react";

import { cx } from "@/components/ui";
import {
  type AttachmentDto,
  type AttachmentInput,
  MAX_ATTACHMENTS_PER_ITEM,
  UPLOAD_ACCEPT,
} from "@/lib/contracts/attachments";
import { uploadFile, UploadError } from "@/lib/upload";

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Compose: draft state + tray
// ---------------------------------------------------------------------------

type DraftItem = {
  key: string;
  name: string;
  isImage: boolean;
  previewUrl?: string;
  status: "uploading" | "done" | "error";
  error?: string;
  input?: AttachmentInput;
};

export type AttachmentDraft = ReturnType<typeof useAttachmentDraft>;

let counter = 0;

export function useAttachmentDraft() {
  const [items, setItems] = useState<DraftItem[]>([]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    setItems((prev) => {
      const room = MAX_ATTACHMENTS_PER_ITEM - prev.length;
      const accepted = list.slice(0, Math.max(0, room));
      const next: DraftItem[] = accepted.map((file) => {
        const key = `a${++counter}`;
        const isImage = file.type.startsWith("image/");
        const item: DraftItem = {
          key,
          name: file.name,
          isImage,
          previewUrl: isImage ? URL.createObjectURL(file) : undefined,
          status: "uploading",
        };
        void uploadFile(file)
          .then((input) => {
            setItems((cur) =>
              cur.map((it) =>
                it.key === key ? { ...it, status: "done", input } : it,
              ),
            );
          })
          .catch((err) => {
            setItems((cur) =>
              cur.map((it) =>
                it.key === key
                  ? {
                      ...it,
                      status: "error",
                      error:
                        err instanceof UploadError
                          ? err.message
                          : "Upload failed.",
                    }
                  : it,
              ),
            );
          });
        return item;
      });
      return [...prev, ...next];
    });
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => {
      const gone = prev.find((it) => it.key === key);
      if (gone?.previewUrl) URL.revokeObjectURL(gone.previewUrl);
      return prev.filter((it) => it.key !== key);
    });
  }, []);

  const clear = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl));
      return [];
    });
  }, []);

  const uploading = items.some((it) => it.status === "uploading");
  const inputs: AttachmentInput[] = items
    .filter((it) => it.status === "done" && it.input)
    .map((it) => it.input as AttachmentInput);
  const full = items.length >= MAX_ATTACHMENTS_PER_ITEM;

  return { items, addFiles, remove, clear, uploading, inputs, full };
}

/** The "attach" button — drop it next to a submit button. */
export function AttachButton({
  draft,
  className,
}: {
  draft: AttachmentDraft;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={draft.full}
        aria-label="Attach files"
        className={cx(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-light-blue hover:text-brand-blue disabled:opacity-40",
          className,
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
          <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) draft.addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

/** Thumbnails / chips for files still being composed. */
export function AttachmentDraftTray({ draft }: { draft: AttachmentDraft }) {
  if (draft.items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {draft.items.map((it) => (
        <div
          key={it.key}
          className={cx(
            "relative flex items-center gap-2 rounded-xl border bg-surface p-1.5 pr-7 text-xs",
            it.status === "error"
              ? "border-red-300"
              : "border-border",
          )}
        >
          {it.isImage && it.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={it.previewUrl}
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-light-blue text-brand-blue">
              <FileIcon />
            </span>
          )}
          <span className="max-w-[8rem] truncate font-medium text-navy">
            {it.status === "error" ? (it.error ?? "Upload failed") : it.name}
          </span>
          {it.status === "uploading" && (
            <span className="text-muted">uploading…</span>
          )}
          <button
            type="button"
            onClick={() => draft.remove(it.key)}
            aria-label={`Remove ${it.name}`}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-background hover:text-navy"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Display: attachments on a saved message / post / comment
// ---------------------------------------------------------------------------

export function AttachmentList({
  attachments,
  className,
}: {
  attachments: AttachmentDto[];
  className?: string;
}) {
  if (!attachments || attachments.length === 0) return null;
  const images = attachments.filter((a) => a.kind === "image");
  const files = attachments.filter((a) => a.kind === "file");

  return (
    <div className={cx("space-y-2", className)}>
      {images.length > 0 && (
        <div
          className={cx(
            "grid gap-2",
            images.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {images.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt={a.name}
                loading="lazy"
                className="max-h-80 w-full bg-light-blue/40 object-cover"
                style={
                  a.width && a.height
                    ? { aspectRatio: `${a.width} / ${a.height}` }
                    : undefined
                }
              />
            </a>
          ))}
        </div>
      )}

      {files.map((a) => (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          download={a.name}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-sm transition-colors hover:bg-light-blue/50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-light-blue text-brand-blue">
            <FileIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-navy">
              {a.name}
            </span>
            <span className="text-xs text-muted">{prettySize(a.size)}</span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-brand-blue">
            Open
          </span>
        </a>
      ))}
    </div>
  );
}
