import type { ApiErrorShape } from "@/lib/contracts/common";

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, body: ApiErrorShape | undefined) {
    super(
      body?.error?.message ?? "Something went wrong. Please try again.",
    );
    this.name = "ApiClientError";
    this.status = status;
    this.code = body?.error?.code ?? "internal";
    this.details = body?.error?.details;
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  signal?: AbortSignal;
};

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const url = new URL(
    path,
    typeof window === "undefined"
      ? "http://localhost:3000"
      : window.location.origin,
  );
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    credentials: "same-origin",
  });

  if (res.status === 204) return undefined as T;

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    throw new ApiClientError(res.status, json as ApiErrorShape | undefined);
  }
  return json as T;
}
