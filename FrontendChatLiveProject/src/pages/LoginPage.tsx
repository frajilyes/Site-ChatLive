import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { LoginFormErrors, LoginFormValues, SubmitState } from '../types'
import { AuthError, hasAccounts, rememberPendingEmail } from '../lib/auth-storage'
import { useAuth } from '../hooks/useAuth'
import { AuthAside } from '../components/auth/AuthAside'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import '../styles/backgrounds/rays.css'
import '../styles/pages/login.css'

const EMPTY: LoginFormValues = { email: '', password: '' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {}
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'This email address does not look valid.'
  }
  if (values.password.length < 8) {
    errors.password = 'The password must be at least 8 characters long.'
  }
  return errors
}

function useRedirectTarget(): { target: string; redirected: boolean } {
  const { state } = useLocation()
  const from = (state as { from?: unknown } | null)?.from
  const valid = typeof from === 'string' && from.startsWith('/')
  return { target: valid ? (from as string) : '/chat', redirected: valid }
}

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const { target, redirected } = useRedirectTarget()
  const navigate = useNavigate()

  const [values, setValues] = useState<LoginFormValues>(EMPTY)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [state, setState] = useState<SubmitState>('idle')
  const [visible, setVisible] = useState(false)
  const [firstVisit] = useState(() => !hasAccounts())

  if (isAuthenticated) return <Navigate to={target} replace />

  const update = <K extends keyof LoginFormValues>(field: K, value: LoginFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setState('error')
      return
    }

    setState('sending')
    try {
      await login(values.email, values.password)
      setState('sent')
      navigate(target, { replace: true })
    } catch (error) {
      const message =
        error instanceof AuthError ? error.message : 'Sign-in unavailable right now.'
      const field = error instanceof AuthError ? error.field : undefined

      if (error instanceof AuthError && error.code === 'EMAIL_NOT_VERIFIED') {
        const email = values.email.trim().toLowerCase()
        rememberPendingEmail(email)
        navigate('/verify', { state: { email, from: target } })
        return
      }

      setErrors(field === 'password' ? { password: message } : { email: message })
      setState('error')
    }
  }

  return (
    <Page
      description="Sign in to your ChatLive account to get back to your rooms and chat live with your friends."
      background="rays"
    >
      <PageHero
        eyebrow="Sign in"
        title={
          <>
            Good to see you <span className="gradient-text">again</span>
          </>
        }
        description="Pick up your rooms, your friends and your conversations right where you left them."
      />

      <section className="section">
        <div className="container auth">
          <Reveal className="auth__form-col">
            <form className="card auth__form" onSubmit={onSubmit} noValidate>
              <h2 className="auth__form-title">Sign in</h2>

              {redirected && (
                <p className="auth__notice">
                  <Icon name="lock" size={15} />
                  Sign in to access the chat and talk with your friends.
                </p>
              )}

              {firstVisit && (
                <p className="auth__notice auth__notice--soft">
                  <Icon name="user-plus" size={15} />
                  <span>
                    You have never signed in from this device.{' '}
                    <Link to="/register" state={{ from: target }}>
                      Create an account in one minute.
                    </Link>
                  </span>
                </p>
              )}

              <div className="field">
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(event) => update('email', event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="field__error" id="login-email-error">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="field field--password">
                <label htmlFor="login-password">Password</label>
                <div className="field__control">
                  <input
                    id="login-password"
                    type={visible ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={values.password}
                    onChange={(event) => update('password', event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    className="field__reveal"
                    onClick={() => setVisible((current) => !current)}
                    aria-pressed={visible}
                    aria-label={
                      visible ? 'Hide password' : 'Show password'
                    }
                  >
                    <Icon name={visible ? 'eye-off' : 'eye'} size={17} />
                  </button>
                </div>
                {errors.password && (
                  <p className="field__error" id="login-password-error">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--lg btn--block"
                disabled={state === 'sending'}
              >
                {state === 'sending' ? 'Signing in...' : 'Sign in'}
                {state !== 'sending' && <Icon name="log-in" size={17} />}
              </button>

              <p
                className={`auth__status auth__status--${state}`}
                role="status"
                aria-live="polite"
              >
                {state === 'idle' &&
                  'Your session stays active on this device until you sign out.'}
                {state === 'sending' && 'Securely checking your credentials...'}
                {state === 'sent' && 'Signed in, opening your rooms...'}
                {state === 'error' && 'Sign-in refused: check the highlighted fields.'}
              </p>

              <div className="auth__separator">
                <span>or</span>
              </div>

              <GoogleAuthButton
                onStart={() => {
                  setErrors({})
                  setState('idle')
                }}
                onSuccess={() => {
                  setState('sent')
                  navigate(target, { replace: true })
                }}
              />

              <p className="auth__switch">
                No account yet?{' '}
                <Link to="/register" state={{ from: target }}>
                  Create a free account
                </Link>
              </p>
            </form>
          </Reveal>

          <AuthAside />
        </div>
      </section>
    </Page>
  )
}
