import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { RegisterFormErrors, RegisterFormValues, SubmitState } from '../types'
import { AuthError } from '../lib/auth-storage'
import { useAuth } from '../hooks/useAuth'
import { useSite } from '../hooks/useSite'
import { AuthAside } from '../components/auth/AuthAside'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import '../styles/backgrounds/waves.css'
import '../styles/pages/register.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function strengthOf(password: string): number {
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password) && /[^\w\s]/.test(password)) score += 1
  return score
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'] as const

function validate(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {}
  if (values.name.trim().length < 2) {
    errors.name = 'Please enter your name (2 characters minimum).'
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'This email address does not look valid.'
  }
  if (values.password.length < 8) {
    errors.password = 'The password must be at least 8 characters long.'
  }
  if (values.confirm !== values.password) {
    errors.confirm = 'The two passwords do not match.'
  }
  if (!values.accept) {
    errors.accept = 'Please accept the terms to continue.'
  }
  return errors
}

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth()
  const { content } = useSite()
  const countries = content.countries
  const { state: routeState } = useLocation()
  const navigate = useNavigate()

  const empty: RegisterFormValues = {
    name: '',
    email: '',
    country: countries[0]?.name ?? '',
    password: '',
    confirm: '',
    accept: false,
  }

  const from = (routeState as { from?: unknown } | null)?.from
  const target = typeof from === 'string' && from.startsWith('/') ? from : '/chat'

  const [values, setValues] = useState<RegisterFormValues>(empty)
  const [errors, setErrors] = useState<RegisterFormErrors>({})
  const [state, setState] = useState<SubmitState>('idle')
  const [visible, setVisible] = useState(false)

  if (isAuthenticated) return <Navigate to={target} replace />

  const update = <K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
  ) => {
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
      const pending = await register({
        name: values.name,
        email: values.email,
        password: values.password,
        country: values.country,
      })

      setState('sent')
      navigate('/verify', {
        replace: true,
        state: {
          email: pending.email,
          delivered: pending.delivered,
          resendInSeconds: pending.resendInSeconds,
          expiresInMinutes: pending.expiresInMinutes,
          from: target,
        },
      })
    } catch (error) {
      const message =
        error instanceof AuthError
          ? error.message
          : 'Sign-up unavailable right now.'
      const field = error instanceof AuthError && error.field ? error.field : 'email'
      setErrors({ [field]: message })
      setState('error')
    }
  }

  const strength = strengthOf(values.password)

  return (
    <Page
      description="Create your ChatLive account in under a minute and join your friends in live rooms, anywhere in the world."
      background="waves"
    >
      <PageHero
        eyebrow="Sign up"
        title={
          <>
            Create your{' '}
            <span className="gradient-text">{content.site.name}</span> account
          </>
        }
        description="Free, no credit card. A confirmation code is waiting in your inbox, and you're in."
      />

      <section className="section">
        <div className="container auth">
          <Reveal className="auth__form-col">
            <form className="card auth__form" onSubmit={onSubmit} noValidate>
              <h2 className="auth__form-title">Create an account</h2>

              <div className="field">
                <label htmlFor="register-name">Full name</label>
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={(event) => update('name', event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'register-name-error' : undefined}
                  placeholder="Alex Johnson"
                />
                {errors.name && (
                  <p className="field__error" id="register-name-error">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="field">
                <label htmlFor="register-email">Email address</label>
                <input
                  id="register-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(event) => update('email', event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'register-email-error' : undefined}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="field__error" id="register-email-error">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="field">
                <label htmlFor="register-country">Country</label>
                <select
                  id="register-country"
                  value={values.country}
                  onChange={(event) => update('country', event.target.value)}
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name} - {country.language}
                    </option>
                  ))}
                </select>
                <p className="field__hint">
                  Sets your default translation language in rooms.
                </p>
              </div>

              <div className="field field--password">
                <label htmlFor="register-password">Password</label>
                <div className="field__control">
                  <input
                    id="register-password"
                    type={visible ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={values.password}
                    onChange={(event) => update('password', event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby="register-password-strength"
                    placeholder="8 characters minimum"
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
                <p className="strength" id="register-password-strength">
                  <span className={`strength__bar strength__bar--${strength}`}>
                    <i />
                  </span>
                  <span className="strength__label">{STRENGTH_LABEL[strength]}</span>
                </p>
                {errors.password && <p className="field__error">{errors.password}</p>}
              </div>

              <div className="field field--password">
                <label htmlFor="register-confirm">Confirm password</label>
                <div className="field__control">
                  <input
                    id="register-confirm"
                    type={visible ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={values.confirm}
                    onChange={(event) => update('confirm', event.target.value)}
                    aria-invalid={Boolean(errors.confirm)}
                    aria-describedby={errors.confirm ? 'register-confirm-error' : undefined}
                    placeholder="Enter it a second time"
                  />
                </div>
                {errors.confirm && (
                  <p className="field__error" id="register-confirm-error">
                    {errors.confirm}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="checkbox" htmlFor="register-accept">
                  <input
                    id="register-accept"
                    type="checkbox"
                    checked={values.accept}
                    onChange={(event) => update('accept', event.target.checked)}
                    aria-invalid={Boolean(errors.accept)}
                  />
                  <span>
                    I accept the <Link to="/terms">terms of use</Link> and the{' '}
                    <Link to="/privacy">privacy policy</Link> of {content.site.name}.
                  </span>
                </label>
                {errors.accept && <p className="field__error">{errors.accept}</p>}
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--lg btn--block"
                disabled={state === 'sending'}
              >
                {state === 'sending' ? 'Creating account...' : 'Create my account'}
                {state !== 'sending' && <Icon name="user-plus" size={17} />}
              </button>

              <p
                className={`auth__status auth__status--${state}`}
                role="status"
                aria-live="polite"
              >
                {state === 'idle' &&
                  'Your password is stored as a hash, never in plain text.'}
                {state === 'sending' && 'Creating your secure account...'}
                {state === 'sent' && 'Account created! Sending your confirmation code...'}
                {state === 'error' && 'Sign-up refused: check the highlighted fields.'}
              </p>

              <div className="auth__separator">
                <span>or</span>
              </div>

              <GoogleAuthButton
                country={values.country}
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
                Already have an account?{' '}
                <Link to="/login" state={{ from: target }}>
                  Sign in
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
