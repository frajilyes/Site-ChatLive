import type { Request } from "express";

import type { UserDocument } from "../Models/userAuth";
import ApiError from "./ApiError";

export function requireUser(req: Request): UserDocument {
  if (!req.user) {
    throw ApiError.unauthorized("You must be signed in to access this page.");
  }
  return req.user;
}
