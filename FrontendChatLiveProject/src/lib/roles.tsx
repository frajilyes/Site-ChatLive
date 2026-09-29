import type { AuthUser, ChatUser, MemberRole, UserRole } from '../types'

const ROLE_RANKS: Record<UserRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
}

export function canAccess(user: AuthUser | null, minimum: UserRole): boolean {
  if (!user) return false
  return ROLE_RANKS[user.role] >= ROLE_RANKS[minimum]
}

export function roleLabel(role: UserRole): string {
  if (role === 'admin') return 'Administrator'
  if (role === 'moderator') return 'Moderator'
  return 'Member'
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  user: 'Their account, their rooms, their messages.',
  moderator: 'Manages communities, testimonials and contact messages.',
  admin: 'Everything, including accounts, roles and site content.',
}

export function memberRoleLabel(role: MemberRole): string {
  if (role === 'owner') return 'Owner'
  if (role === 'moderator') return 'Moderator'
  return 'Member'
}

export function canModerateRoom(
  user: AuthUser | null,
  members: readonly ChatUser[],
): boolean {
  if (!user) return false
  if (canAccess(user, 'admin')) return true

  const self = members.find((member) => member.id === user.id)
  return self?.roomRole === 'owner' || self?.roomRole === 'moderator'
}

export function canGrantRoomRoles(
  user: AuthUser | null,
  members: readonly ChatUser[],
): boolean {
  if (!user) return false
  if (canAccess(user, 'admin')) return true

  const self = members.find((member) => member.id === user.id)
  return self?.roomRole === 'owner'
}
