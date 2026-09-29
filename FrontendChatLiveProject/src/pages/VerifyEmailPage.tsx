import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { SubmitState } from '../types'
import { AuthError, readPendingEmail } from '../lib/auth-storage'
import { useAuth } from '../hooks/useAuth'
import { AuthAside } from '../components/auth/AuthAside'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import '../styles/backgrounds/pulse.css'
import '../styles/pages/verifyemail.css'

const CODE_LENGTH = 6

const EMPTY_CODE = Array.from({ length: CODE_LENGTH }, () => '')

interface VerifyRouteState {
  email?: string
  delivered?: boolean
  resendInSeconds?: number
  expiresInMinutes?: number
  from?: string
}

export default function VerifyEmailPage() {
  const { isAuthenticated, verifyEmail, resendCode } = useAuth()
  const { state: routeState } = useLocation()
  const navigate = useNavigate()

  const incoming = (routeState ?? {}) as VerifyRouteState
  const target =
    typeof incoming.from === 'string' && incoming.from.startsWith('/')
      ? incoming.from
      : '/chat'

  const [email] = useState(() => incoming.email ?? readPendingEmail() ?? '')

  const [digits, setDigits] = useState<readonly string[]>(EMPTY_CODE)
  const [state, setState] = useState<SubmitState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(
    incoming.delivered === false
      ? "The email could not be sent. Request a new code, or get it from the server console if you are developing without SMTP."
      : null,
  )
  const [cooldown, setCooldown] = useState(incoming.resendInSeconds ?? 0)

  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const submitting = useRef(false)

  const code = digits.join('')

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const focusAt = (index: number) => {
    inputs.current[Math.min(Math.max(index, 0), CODE_LENGTH - 1)]?.focus()
  }

  const submit = useCallback(
    async (value: string) => {
      if (submitting.current || value.length !== CODE_LENGTH) return

      submitting.current = true
      setState('sending')
      setError(null)

      try {
        await verifyEmail(email, value)
        setState('sent')
        navigate(target, { replace: true })
      } catch (caught) {
        const failure =
          caught instanceof AuthError
            ? caught
            : new AuthError('Confirmation unavailable right now.')

        if (failure.code === 'ALREADY_VERIFIED') {
          navigate('/login', { replace: true, state: { from: target } })
          return
        }

        setError(failure.message)
        setState('error')
        if (failure.code === 'CODE_EXPIRED') setCooldown(0)
        setDigits(EMPTY_CODE)
        focusAt(0)
      } finally {
        submitting.current = false
      }
    },
    [email, navigate, target, verifyEmail],
  )

  if (isAuthenticated) return <Navigate to={target} replace />

  if (!email) return <Navigate to="/register" replace />

  const write = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, '')
    if (!typed) {
      setDigits((current) => current.map((digit, slot) => (slot === index ? '' : digit)))
      return
    }

    const next = [...digits]
    for (let offset = 0; offset < typed.length && index + offset < CODE_LENGTH; offset += 1) {
      next[index + offset] = typed[offset]
    }
    setDigits(next)
    setError(null)
    focusAt(index + typed.length)

    const joined = next.join('')
    if (joined.length === CODE_LENGTH) void submit(joined)
  }

  const onKeyDown = (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      setDigits((current) => current.map((digit, slot) => (slot === index - 1 ? '' : digit)))
      focusAt(index - 1)
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusAt(index - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusAt(index + 1)
    }
  }

  const onPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return

    event.preventDefault()
    const next = EMPTY_CODE.map((_, slot) => pasted[slot] ?? '')
    setDigits(next)
    setError(null)
    focusAt(pasted.length)

    if (pasted.length === CODE_LENGTH) void submit(pasted)
  }

  const onResend = async () => {
    if (cooldown > 0 || state === 'sending') return

    setError(null)
    setNotice(null)

    try {
      const pending = await resendCode(email)
      setDigits(EMPTY_CODE)
      focusAt(0)
      setCooldown(pending.resendInSeconds)
      setNotice(
        pending.delivered
          ? `New code sent to ${pending.email}. It is valid for ${pending.expiresInMinutes} minutes.`
          : "The email could not be sent. If you are developing without SMTP, the code is in the server console.",
      )
      setState('idle')
    } catch (caught) {
      const failure =
        caught instanceof AuthError
          ? caught
          : new AuthError('Sending unavailable right now.')

      if (failure.code === 'ALREADY_VERIFIED') {
        navigate('/login', { replace: true, state: { from: target } })
        return
      }

      if (failure.code === 'TOO_SOON' && failure.retryAfter) {
        setCooldown(failure.retryAfter)
      }

      setError(failure.message)
      setState('error')
    }
  }

  return (
    <Page
      description="Enter the six-digit code received by email to activate your ChatLive account."
      background="pulse"
    >
      <PageHero
        eyebrow="Last step"
        title={
          <>
            Confirm your <span className="gradient-text">email address</span>
          </>
        }
        description="We just sent you a six-digit code. It activates your account and signs you in right away."
      />

      <section className="section">
        <div className="container auth">
          <Reveal className="auth__form-col">
            <form
              className="card auth__form"
              onSubmit={(event) => {
                event.preventDefault()
                void submit(code)
              }}
              noValidate
            >
              <h2 className="auth__form-title">Enter your code</h2>

              <p className="auth__notice">
                <Icon name="mail" size={15} />
                <span>
                  Code sent to <strong>{email}</strong>. Check your spam folder if it takes a
                  while to arrive.
                </span>
              </p>

              {notice && (
                <p className="auth__notice auth__notice--soft">
                  <Icon name="bolt" size={15} />
                  <span>{notice}</span>
                </p>
              )}

              <div className="field">
                <label htmlFor="verify-code-0">Confirmation code</label>
                <div
                  className="code"
                  role="group"
                  aria-label={`${CODE_LENGTH}-digit confirmation code`}
                >
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(node) => {
                        inputs.current[index] = node
                      }}
                      id={`verify-code-${index}`}
                      className="code__slot"
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={CODE_LENGTH}
                      value={digit}
                      onChange={(event) => write(index, event.target.value)}
                      onKeyDown={onKeyDown(index)}
                      onPaste={onPaste}
                      onFocus={(event) => event.target.select()}
                      autoFocus={index === 0}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? 'verify-code-error' : undefined}
                      disabled={state === 'sending'}
                    />
                  ))}
                </div>
                {error && (
                  <p className="field__error" id="verify-code-error">
                    {error}
                  </p>
                )}
                <p className="field__hint">
                  Valid for {incoming.expiresInMinutes ?? 15} minutes, after which you need to
                  request a new one.
                </p>
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--lg btn--block"
                disabled={state === 'sending' || code.length !== CODE_LENGTH}
              >
                {state === 'sending' ? 'Verifying...' : 'Confirm my address'}
                {state !== 'sending' && <Icon name="check" size={17} />}
              </button>

              <p
                className={`auth__status auth__status--${state}`}
                role="status"
                aria-live="polite"
              >
                {state === 'idle' && 'The code is checked automatically as soon as the sixth digit is entered.'}
                {state === 'sending' && 'Checking the code...'}
                {state === 'sent' && 'Address confirmed! Opening your rooms...'}
                {state === 'error' && 'Code refused: check the digits you entered.'}
              </p>

              <div className="auth__separator">
                <span>or</span>
              </div>

              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={() => void onResend()}
                disabled={cooldown > 0 || state === 'sending'}
              >
                {cooldown > 0
                  ? `Resend the code in ${cooldown} s`
                  : 'Resend the code'}
              </button>

              <p className="auth__switch">
                Wrong address?{' '}
                <Link to="/register" state={{ from: target }}>
                  Start sign-up again
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
