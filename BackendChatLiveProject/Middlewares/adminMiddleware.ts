import type { NextFunction, Request, RequestHandler, Response } from "express";

import ApiError from "../Utils/ApiError";
import { type Ref, idOf } from "../Utils/ids";
import { atLeast, roleLabel } from "../Utils/roles";
import type { UserRole } from "../types/index";

export const requireRole =
  (minimum: UserRole): RequestHandler =>
  (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("You must be signed in to access this page."));
    }
    if (!atLeast(req.user.role, minimum)) {
      return next(
        ApiError.forbidden(`This action requires at least the ${roleLabel(minimum)} role.`),
      );
    }
    next();
  };

export const isAdmin: RequestHandler = requireRole("admin");

export const isModerator: RequestHandler = requireRole("moderator");

type OwnerLookup = (req: Request) => Promise<Ref | null | undefined> | Ref | null | undefined;

export const isOwnerOrAdmin =
  (getOwnerId: OwnerLookup): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized("You must be signed in to access this page."));
      }
      if (req.user.role === "admin") return next();

      const ownerId = await getOwnerId(req);
      if (!ownerId) {
        return next(ApiError.notFound("This resource does not exist."));
      }
      if (idOf(ownerId) !== idOf(req.user._id)) {
        return next(ApiError.forbidden("You cannot access this resource."));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
