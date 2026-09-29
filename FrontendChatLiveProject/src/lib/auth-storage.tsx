import type { AuthUser } from '../types'
import type { PendingVerificationResponse } from './api'
import { ApiError, authApi, clearToken, readToken, writeToken } from './api'

const SESSION_KEY = 'chatlive-session'
const KNOWN_KEY = 'chatlive-known-account'
const PENDING_KEY = 'chatlive-pending-email'

export const SESSION_CLOSED_EVENT = 'chatlive:session-closed'

export type AuthField = 'name' | 'email' | 'password' | 'country' | 'code'

const AUTH_FIELDS: readonly string[] = ['name', 'email', 'password', 'country', 'code']

export class AuthError extends Error {
  readonly field?: AuthField

  readonly code?: string

  readonly retryAfter?: number

  constructor(message: string, field?: AuthField, code?: string, retryAfter?: number) {
    super(message)
    this.name = 'AuthError'
    this.field = field
    this.code = code
    this.retryAfter = retryAfter
  }
}

export interface RegisterInput {
  readonly name: string
  readonly email: string
  readonly password: string
  readonly country: string
}

export type PendingVerification = PendingVerificationResponse

export interface GoogleSession {
  readonly user: AuthUser
  readonly created: boolean
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function toAuthError(error: unknown): AuthError {
  if (error instanceof ApiError) {
    const field =
      error.field && AUTH_FIELDS.includes(error.field) ? (error.field as AuthField) : undefined
    return new AuthError(error.message, field, error.code, error.retryAfter)
  }
  return new AuthError('Sign-in unavailable right now.')
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function rememberDevice(): void {
  try {
    window.localStorage.setItem(KNOWN_KEY, '1')
  } catch {}
}

export function rememberPendingEmail(email: string): void {
  try {
    window.localStorage.setItem(PENDING_KEY, email)
  } catch {}
}

export function readPendingEmail(): string | null {
  try {
    return window.localStorage.getItem(PENDING_KEY)
  } catch {
    return null
  }
}

export function clearPendingEmail(): void {
  try {
    window.localStorage.removeItem(PENDING_KEY)
  } catch {}
}

export async function registerAccount(input: RegisterInput): Promise<PendingVerification> {
  try {
    const pending = await authApi.register({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      country: input.country,
    })

    rememberPendingEmail(pending.email)
    return pending
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function confirmEmail(email: string, code: string): Promise<AuthUser> {
  try {
    const { token, user } = await authApi.verify(
      email.trim().toLowerCase(),
      code.replace(/\D/g, ''),
    )

    writeToken(token)
    writeSession(user)
    rememberDevice()
    clearPendingEmail()
    return user
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function resendConfirmationCode(email: string): Promise<PendingVerification> {
  try {
    return await authApi.resendCode(email.trim().toLowerCase())
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function authenticate(email: string, password: string): Promise<AuthUser> {
  try {
    const { token, user } = await authApi.login(email.trim().toLowerCase(), password)

    writeToken(token)
    writeSession(user)
    rememberDevice()
    return user
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function authenticateWithGoogle(
  credential: string,
  country?: string,
): Promise<GoogleSession> {
  try {
    const { token, user, created } = await authApi.google(credential, country)

    writeToken(token)
    writeSession(user)
    rememberDevice()
    return { user, created }
  } catch (error) {
    throw toAuthError(error)
  }
}

export function hasAccounts(): boolean {
  try {
    return window.localStorage.getItem(KNOWN_KEY) === '1' || readSession() !== null
  } catch {
    return false
  }
}

export function readSession(): AuthUser | null {
  if (!readToken()) return null

  try {
    const user = safeParse<AuthUser | null>(window.localStorage.getItem(SESSION_KEY), null)
    return user && typeof user.id === 'string' && typeof user.email === 'string' ? user : null
  } catch {
    return null
  }
}

export function writeSession(user: AuthUser): void {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } catch {}
}

export function clearSession(): void {
  window.dispatchEvent(new CustomEvent(SESSION_CLOSED_EVENT))
  clearToken()

  try {
    window.google?.accounts.id.disableAutoSelect()
  } catch {}

  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {}
}

export async function restoreSession(): Promise<AuthUser | null> {
  const cached = readSession()

  try {
    const { user } = await authApi.me()
    writeSession(user)
    return user
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      return cached
    }
    clearSession()
    return null
  }
}

export async function endSession(): Promise<void> {
  try {
    await authApi.logout()
  } catch {}
  clearSession()
}
