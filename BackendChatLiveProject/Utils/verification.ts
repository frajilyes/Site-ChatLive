import crypto from "node:crypto";

import bcrypt from "bcrypt";

import { env } from "../config/env";

export const CODE_LENGTH = 6;

export const MAX_ATTEMPTS = 5;

const SALT_ROUNDS = 10;

export function generateCode(): string {
  return String(crypto.randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

export function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, SALT_ROUNDS);
}

export function matchesCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function expiryFromNow(): Date {
  return new Date(Date.now() + env.VERIFICATION_TTL_MINUTES * 60_000);
}

export function resendCooldown(sentAt: Date | undefined | null): number {
  if (!sentAt) return 0;
  const elapsed = (Date.now() - sentAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(env.VERIFICATION_RESEND_SECONDS - elapsed));
}
