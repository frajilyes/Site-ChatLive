import { lazy } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'

const AuthPrompt = lazy(() =>
  import('./AuthPrompt').then((module) => ({ default: module.AuthPrompt })),
)

export function RequireAuth({ children }: { readonly children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <AuthPrompt />
}
