import { createContext } from 'react'
import type { AuthStatus, AuthUser } from '../types'
import type { GoogleSession, PendingVerification, RegisterInput } from '../lib/auth-storage'

export interface AuthContextValue {
  readonly user: AuthUser | null
  readonly status: AuthStatus
  readonly isAuthenticated: boolean
  readonly login: (email: string, password: string) => Promise<AuthUser>
  readonly register: (input: RegisterInput) => Promise<PendingVerification>
  readonly verifyEmail: (email: string, code: string) => Promise<AuthUser>
  readonly resendCode: (email: string) => Promise<PendingVerification>
  readonly loginWithGoogle: (credential: string, country?: string) => Promise<GoogleSession>
  readonly logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
