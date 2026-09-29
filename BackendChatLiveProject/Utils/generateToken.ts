import jwt, { JsonWebTokenError, type SignOptions } from "jsonwebtoken";
import type { Types } from "mongoose";

import { env } from "../config/env";
import type { UserRole } from "../types/index";
import { isUserRole } from "./roles";

export interface TokenPayload {
  id: string;
  role: UserRole;
  v: number;
}

const ALGORITHM = "HS256" as const;

function secret(): string {
  const value = env.JWT_SECRET;
  if (!value) {
    throw new Error("JWT_SECRET est absent du fichier .env");
  }
  return value;
}

export function signToken(
  id: Types.ObjectId | string,
  role: UserRole,
  version = 0,
): string {
  const options: SignOptions = {
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign({ id: String(id), role, v: version }, secret(), options);
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, secret(), { algorithms: [ALGORITHM] });
  if (typeof decoded === "string" || typeof decoded.id !== "string") {
    throw new JsonWebTokenError("Invalid token.");
  }
  return {
    id: decoded.id,
    role: isUserRole(decoded.role) ? decoded.role : "user",
    v: typeof decoded.v === "number" ? decoded.v : 0,
  };
}

export function isCurrentSession(payload: TokenPayload, user: { tokenVersion?: number }): boolean {
  return payload.v === (user.tokenVersion ?? 0);
}
