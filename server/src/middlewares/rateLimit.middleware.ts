import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Requests allowed per key per window. */
  max: number;
  /** Builds the bucket key. Defaults to the client IP. */
  key?: (req: Request) => string;
  message?: string;
}

/**
 * Small in-memory fixed-window rate limiter for the auth endpoints. It is per process:
 * with several server instances each one counts separately, which still caps brute
 * force. Keys include the submitted email where relevant, so users behind one shared
 * office IP or proxy do not lock each other out.
 */
export const rateLimit = ({ windowMs, max, key, message }: RateLimitOptions) => {
  const buckets = new Map<string, Bucket>();

  // Drop expired buckets periodically so memory stays bounded
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }, Math.max(windowMs, 60_000));
  sweep.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const bucketKey = (key ? key(req) : req.ip) || 'unknown';

    let bucket = buckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(bucketKey, bucket);
    }
    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));

    if (bucket.count > max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return next(new ApiError(429, message || `Too many attempts. Please try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`, 'RATE_LIMITED'));
    }
    next();
  };
};

const emailOf = (req: Request) => String(req.body?.email || '').trim().toLowerCase();

/** 10 login attempts per email per IP every 15 minutes. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  key: (req) => `login:${req.ip}:${emailOf(req)}`,
});

/** 5 reset emails per email per hour, and 20 per IP per hour. */
export const forgotPasswordLimiter = [
  rateLimit({ windowMs: 60 * 60 * 1000, max: 5, key: (req) => `forgot:email:${emailOf(req)}` }),
  rateLimit({ windowMs: 60 * 60 * 1000, max: 20, key: (req) => `forgot:ip:${req.ip}` }),
];

/** Token guessing on reset and invite links: 20 per IP every 15 minutes. */
export const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  key: (req) => `token:${req.path}:${req.ip}`,
});
