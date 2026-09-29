import type { ErrorRequestHandler, RequestHandler } from "express";

import ApiError from "../Utils/ApiError";
import type { ErrorBody } from "../types/index";

export const notFound: RequestHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.path.slice(0, 200)}`));
};

interface NormalizedError {
  statusCode: number;
  message: string;
  field?: string;
  code?: string;
  retryAfter?: number;
}

function read<T = unknown>(err: unknown, key: string): T | undefined {
  if (err && typeof err === "object" && key in err) {
    return (err as Record<string, T>)[key];
  }
  return undefined;
}

function normalize(err: unknown): NormalizedError {
  if (err instanceof ApiError) {
    return {
      statusCode: err.statusCode,
      message: err.message,
      field: err.field,
      code: err.code,
      retryAfter: err.retryAfter,
    };
  }

  if (read(err, "code") === 11000) {
    const keyValue = read<Record<string, unknown>>(err, "keyValue") ?? {};
    const field = Object.keys(keyValue)[0];
    const message =
      field === "email"
        ? "An account already exists with this email address."
        : "This value is already in use.";
    return { statusCode: 409, message, field };
  }

  const name = read<string>(err, "name");

  if (name === "ValidationError") {
    const errors = read<Record<string, { message?: string; path?: string }>>(err, "errors") ?? {};
    const first = Object.values(errors)[0];
    return {
      statusCode: 400,
      message: first?.message ?? "Invalid data.",
      field: first?.path,
    };
  }

  if (name === "CastError") {
    return {
      statusCode: 400,
      message: "This identifier is not valid.",
      field: read<string>(err, "path"),
    };
  }

  if (name === "JsonWebTokenError") {
    return { statusCode: 401, message: "Invalid token." };
  }
  if (name === "TokenExpiredError") {
    return { statusCode: 401, message: "Your session has expired, please sign in again." };
  }

  const type = read<string>(err, "type");

  if (type === "entity.parse.failed") {
    return { statusCode: 400, message: "The request body is not valid JSON." };
  }
  if (type === "entity.too.large") {
    return { statusCode: 413, message: "The request body is too large." };
  }
  if (type === "parameters.too.many") {
    return { statusCode: 413, message: "The request has too many parameters." };
  }

  const status = read<number>(err, "statusCode") ?? read<number>(err, "status");
  return {
    statusCode: status && status >= 400 && status < 600 ? status : 500,
    message:
      process.env.NODE_ENV === "development"
        ? (err instanceof Error && err.message) || "An internal error occurred."
        : "An internal error occurred.",
  };
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const { statusCode, message, field, code, retryAfter } = normalize(err);

  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const body: ErrorBody = { success: false, message };
  if (field) body.field = field;
  if (code) body.code = code;
  if (retryAfter !== undefined) body.retryAfter = retryAfter;
  if (process.env.NODE_ENV === "development" && statusCode >= 500 && err instanceof Error) {
    body.stack = err.stack;
  }
  if (statusCode === 429 && retryAfter !== undefined) {
    res.setHeader("Retry-After", String(retryAfter));
  }

  res.status(statusCode).json(body);
};
