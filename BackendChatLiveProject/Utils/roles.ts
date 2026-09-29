import type { MemberRole, UserRole } from "../types/index";

const ROLE_RANKS: Record<UserRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
};

export const USER_ROLES: readonly UserRole[] = ["user", "moderator", "admin"];

export const MEMBER_ROLES: readonly MemberRole[] = ["owner", "moderator", "member"];

export function atLeast(role: UserRole, minimum: UserRole): boolean {
  return ROLE_RANKS[role] >= ROLE_RANKS[minimum];
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function isMemberRole(value: unknown): value is MemberRole {
  return typeof value === "string" && MEMBER_ROLES.includes(value as MemberRole);
}

export function roleLabel(role: UserRole): string {
  if (role === "admin") return "administrator";
  if (role === "moderator") return "moderator";
  return "member";
}
