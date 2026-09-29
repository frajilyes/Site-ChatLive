import { useEffect, useState } from 'react'

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const SCRIPT_ID = 'google-identity-services'

export type GoogleIdentityStatus =
  | 'unconfigured'
  | 'loading'
  | 'ready'
  | 'unavailable'

export interface GoogleIdentity {
  readonly status: GoogleIdentityStatus
  readonly clientId: string
}

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()

let loading: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (loading) return loading

  loading = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      if (window.google) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('script unavailable')))
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      loading = null
      reject(new Error('script unavailable'))
    }
    document.head.appendChild(script)
  })

  return loading
}

export function useGoogleIdentity(): GoogleIdentity {
  const [status, setStatus] = useState<GoogleIdentityStatus>(() => {
    if (!CLIENT_ID) return 'unconfigured'
    return window.google ? 'ready' : 'loading'
  })

  useEffect(() => {
    if (!CLIENT_ID || window.google) return

    let cancelled = false

    loadScript().then(
      () => {
        if (cancelled) return
        setStatus(window.google ? 'ready' : 'unavailable')
      },
      () => {
        if (!cancelled) setStatus('unavailable')
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  return { status, clientId: CLIENT_ID }
}
