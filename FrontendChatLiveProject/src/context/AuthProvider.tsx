import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthUser } from '../types'
import type { RegisterInput } from '../lib/auth-storage'
import {
  authenticate,
  authenticateWithGoogle,
  clearSession,
  confirmEmail,
  endSession,
  readSession,
  registerAccount,
  resendConfirmationCode,
  restoreSession,
  writeSession,
} from '../lib/auth-storage'
import { UNAUTHORIZED_EVENT } from '../lib/api'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readSession)

  useEffect(() => {
    if (!readSession()) return

    let cancelled = false
    void restoreSession().then((account) => {
      if (!cancelled) setUser(account)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession()
      setUser(null)
    }

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const account = await authenticate(email, password)
    writeSession(account)
    setUser(account)
    return account
  }, [])

  const register = useCallback((input: RegisterInput) => registerAccount(input), [])

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const account = await confirmEmail(email, code)
    writeSession(account)
    setUser(account)
    return account
  }, [])

  const resendCode = useCallback((email: string) => resendConfirmationCode(email), [])

  const loginWithGoogle = useCallback(async (credential: string, country?: string) => {
    const session = await authenticateWithGoogle(credential, country)
    writeSession(session.user)
    setUser(session.user)
    return session
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    void endSession()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status: user ? 'authenticated' : 'anonymous',
      isAuthenticated: user !== null,
      login,
      register,
      verifyEmail,
      resendCode,
      loginWithGoogle,
      logout,
    }),
    [user, login, register, verifyEmail, resendCode, loginWithGoogle, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
