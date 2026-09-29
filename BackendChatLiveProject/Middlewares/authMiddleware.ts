import type { RequestHandler } from "express";

import User from "../Models/userAuth";
import ApiError from "../Utils/ApiError";
import asyncHandler from "../Utils/asyncHandler";
import { type TokenPayload, isCurrentSession, verifyToken } from "../Utils/generateToken";

function bearerToken(header: string | undefined): string | null {
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token && token.length <= 2048 ? token : null;
}

export const protect: RequestHandler = asyncHandler(async (req, res, next) => {
  const token = bearerToken(req.headers.authorization);
  if (!token) {
    throw ApiError.unauthorized("You must be signed in to access this page.");
  }

  let decoded: TokenPayload;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw err instanceof Error && err.name === "TokenExpiredError"
      ? ApiError.unauthorized("Your session has expired, please sign in again.")
      : ApiError.unauthorized("Invalid token.");
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    throw ApiError.unauthorized("The account linked to this token no longer exists.");
  }
  if (!isCurrentSession(decoded, currentUser)) {
    throw ApiError.unauthorized("Your session was closed, please sign in again.");
  }

  req.user = currentUser;
  next();
});

export const optionalAuth: RequestHandler = asyncHandler(async (req, res, next) => {
  const token = bearerToken(req.headers.authorization);
  req.user = null;

  if (token) {
    try {
      const decoded = verifyToken(token);
      const found = await User.findById(decoded.id);
      req.user = found && isCurrentSession(decoded, found) ? found : null;
    } catch {
      req.user = null;
    }
  }

  next();
});
