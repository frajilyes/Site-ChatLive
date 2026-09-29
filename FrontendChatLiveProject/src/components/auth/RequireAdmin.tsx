import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { UserRole } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { canAccess, roleLabel } from '../../lib/roles'
import { AuthPrompt } from './AuthPrompt'
import { Page } from '../layout/Page'
import { Icon } from '../ui/Icon'
import { Reveal } from '../ui/Reveal'
import '../../styles/backgrounds/pulse.css'
import '../../styles/pages/authgate.css'

export function RequireAdmin({
  children,
  minimum = 'moderator',
}: {
  readonly children: ReactNode
  readonly minimum?: UserRole
}) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) return <AuthPrompt />

  if (!canAccess(user, minimum)) {
    return (
      <Page
        description="This page is reserved for site administrators."
        background="pulse"
      >
        <section className="section auth-gate">
          <div className="container">
            <Reveal className="card auth-gate__card">
              <span className="auth-gate__lock">
                <Icon name="shield" size={26} />
              </span>
              <h1 className="auth-gate__title">
                This page is <span className="gradient-text">reserved for the team</span>
              </h1>
              <p className="auth-gate__desc">
                This page requires at least the {roleLabel(minimum).toLowerCase()} role; your
                account is {roleLabel(user?.role ?? 'user').toLowerCase()}. If you think it
                should have more, write to us: an administrator can grant it to you.
              </p>
              <div className="auth-gate__actions">
                <Link to="/" className="btn btn--primary btn--lg">
                  Back to home
                </Link>
                <Link to="/contact" className="btn btn--ghost btn--lg">
                  Write to us
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </Page>
    )
  }

  return <>{children}</>
}
