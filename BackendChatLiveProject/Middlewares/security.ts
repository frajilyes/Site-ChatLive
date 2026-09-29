import type { Request, RequestHandler } from "express";
import { rateLimit, type Options } from "express-rate-limit";
import helmet from "helmet";

import ApiError from "../Utils/ApiError";

export const securityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "no-referrer" },
  strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: true },
});

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const MAX_DEPTH = 10;

function scrub(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    throw ApiError.badRequest("The request body is nested too deeply.");
  }
  if (Array.isArray(value)) {
    return value.map((item) => scrub(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const clean: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".") || FORBIDDEN_KEYS.has(key)) continue;
      clean[key] = scrub(entry, depth + 1);
    }
    return clean;
  }
  return value;
}

export const sanitizeInput: RequestHandler = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      req.body = scrub(req.body);
    }
    next();
  } catch (error) {
    next(error);
  }
};

function minutes(ms: number): number {
  return Math.max(1, Math.round(ms / 60_000));
}

function limiter(
  options: Partial<Options> & { windowMs: number; limit: number; message: string },
): RequestHandler {
  const { message, ...rest } = options;
  return rateLimit({
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ...rest,
    handler: (req, res, next, used) => {
      const resetTime = (req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit
        ?.resetTime;
      const retryAfter = resetTime
        ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : Math.ceil(used.windowMs / 1000);
      next(new ApiError(429, message).withCode("RATE_LIMITED").withRetryAfter(retryAfter));
    },
  });
}

export const apiLimiter = limiter({
  windowMs: 60_000,
  limit: 300,
  message: "Too many requests. Please wait a moment before trying again.",
});

function emailOf(req: Request): string {
  const email = req.body?.email;
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

const LOGIN_WINDOW = 15 * 60_000;

export const loginIpLimiter = limiter({
  windowMs: LOGIN_WINDOW,
  limit: 20,
  message: `Too many sign-in attempts. Try again in ${minutes(LOGIN_WINDOW)} minutes.`,
});

export const loginAccountLimiter = limiter({
  windowMs: LOGIN_WINDOW,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `login:${emailOf(req)}`,
  skip: (req) => !emailOf(req),
  message: `Too many attempts on this account. Try again in ${minutes(LOGIN_WINDOW)} minutes.`,
});

export const signupLimiter = limiter({
  windowMs: 60 * 60_000,
  limit: 10,
  message: "Too many sign-ups from this connection. Try again in an hour.",
});

export const verifyLimiter = limiter({
  windowMs: 15 * 60_000,
  limit: 15,
  message: "Too many code attempts. Try again in 15 minutes.",
});

export const formLimiter = limiter({
  windowMs: 60 * 60_000,
  limit: 10,
  message: "Too many submissions from this connection. Try again in an hour.",
});
