/**
 * Typed API errors. Route handlers throw these; `handleRoute` turns them into
 * clean JSON. Raw DB / unexpected errors become a generic 500 — never leak SQL.
 */

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "conflict"
  | "rate_limited"
  | "internal";

const STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation: 422,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
};

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }

  static unauthorized(message = "You need to sign in to do that.") {
    return new ApiError("unauthorized", message);
  }
  static forbidden(message = "You don't have access to that.") {
    return new ApiError("forbidden", message);
  }
  static notFound(message = "We couldn't find that.") {
    return new ApiError("not_found", message);
  }
  static validation(message = "Please check the form and try again.", details?: unknown) {
    return new ApiError("validation", message, details);
  }
  static conflict(message: string) {
    return new ApiError("conflict", message);
  }
  static rateLimited(message = "You're doing that too fast. Please wait a moment.") {
    return new ApiError("rate_limited", message);
  }
}
