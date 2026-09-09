import { ApiError } from "./errors";

/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Good enough for Milestone 1. In a multi-instance deploy each instance keeps
 * its own counters, so this is a soft guard, not a hard quota — swap for a
 * Redis/Upstash limiter before that matters.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateRule = { limit: number; windowMs: number };

export const RATE_RULES = {
  signup: { limit: 5, windowMs: 60 * 60 * 1000 },
  createSchool: { limit: 10, windowMs: 60 * 60 * 1000 },
  createClass: { limit: 20, windowMs: 60 * 60 * 1000 },
  joinClass: { limit: 40, windowMs: 60 * 60 * 1000 },
  createPost: { limit: 30, windowMs: 60 * 60 * 1000 },
  createComment: { limit: 60, windowMs: 60 * 60 * 1000 },
  helpfulVote: { limit: 120, windowMs: 60 * 60 * 1000 },
  report: { limit: 20, windowMs: 60 * 60 * 1000 },
  sendMessage: { limit: 240, windowMs: 60 * 60 * 1000 },
  startConversation: { limit: 30, windowMs: 60 * 60 * 1000 },
} satisfies Record<string, RateRule>;

export function enforceRateLimit(
  key: string,
  rule: RateRule,
  now = Date.now(),
): void {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return;
  }
  if (existing.count >= rule.limit) {
    throw ApiError.rateLimited();
  }
  existing.count += 1;
}

/** convenience: rate-limit an action for a given actor */
export function rateLimit(
  action: keyof typeof RATE_RULES,
  actorId: string,
): void {
  enforceRateLimit(`${action}:${actorId}`, RATE_RULES[action]);
}
