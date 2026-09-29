import { useCallback, useEffect, useRef, useState } from 'react'
import { useGoogleIdentity } from '../../hooks/useGoogleIdentity'
import { useAuth } from '../../hooks/useAuth'
import { AuthError } from '../../lib/auth-storage'

interface GoogleAuthButtonProps {
  readonly country?: string
  readonly onSuccess: (created: boolean) => void
  readonly onStart?: () => void
}

const MAX_WIDTH = 400
const MIN_WIDTH = 200

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}

export function GoogleAuthButton({ country, onSuccess, onStart }: GoogleAuthButtonProps) {
  const { status, clientId } = useGoogleIdentity()
  const { loginWithGoogle } = useAuth()

  const frame = useRef<HTMLDivElement>(null)
  const slot = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const element = frame.current
    if (!element) return

    const measure = () => {
      const next = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, element.clientWidth)))
      setWidth((current) => (current === next ? current : next))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const latest = useRef({ country, onSuccess, onStart })
  useEffect(() => {
    latest.current = { country, onSuccess, onStart }
  })

  const handleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    const credential = response.credential
    if (!credential) {
      setError('Google did not send a response. Please try again.')
      return
    }

    const { country: chosen, onSuccess: succeed, onStart: start } = latest.current

    start?.()
    setError(null)
    setPending(true)

    try {
      const session = await loginWithGoogle(credential, chosen)
      succeed(session.created)
    } catch (cause) {
      setError(
        cause instanceof AuthError
          ? cause.message
          : 'Google sign-in is unavailable right now.',
      )
    } finally {
      setPending(false)
    }
  }, [loginWithGoogle])

  useEffect(() => {
    const element = slot.current
    if (status !== 'ready' || !element || width === 0) return

    const identity = window.google?.accounts.id
    if (!identity) return

    identity.initialize({
      client_id: clientId,
      callback: (response) => void handleCredential(response),
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
      ux_mode: 'popup',
    })

    identity.renderButton(element, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'center',
      locale: 'en',
      width,
    })

    return () => {
      element.replaceChildren()
    }
  }, [status, clientId, width, handleCredential])

  return (
    <div className="auth__google">
      <div
        className="auth__google-frame"
        ref={frame}
        data-pending={pending || undefined}
        aria-busy={pending}
      >
        <div className="auth__google-slot" ref={slot} />

        {status !== 'ready' && (
          <button
            type="button"
            className="btn btn--ghost btn--lg btn--block auth__google-fallback"
            disabled
          >
            <GoogleGlyph />
            {status === 'loading' ? 'Loading Google...' : 'Continue with Google'}
          </button>
        )}
      </div>

      <p className="auth__google-status" role="status" aria-live="polite">
        {pending && 'Opening your ChatLive session...'}
        {!pending && error}
        {!pending && !error && status === 'unconfigured' && (
          <>Google sign-in unavailable: VITE_GOOGLE_CLIENT_ID is not set.</>
        )}
        {!pending && !error && status === 'unavailable' && (
          <>Google cannot be reached. Use the form above.</>
        )}
      </p>
    </div>
  )
}
