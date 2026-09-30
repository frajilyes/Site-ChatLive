import { useCallback, useEffect, useRef, useState } from 'react'

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const SCRIPT_ID = 'google-identity-services'

// Le premier signe de vie du visiteur. Ce sont les memes evenements que le
// script du document ecoute pour reveiller les animations de fond : arriver sur
// une page et n en rien toucher est le seul cas ou l identite Google ne part
// pas, et c est justement celui de la mesure.
const WAKE = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'scroll', 'keydown']
const WAKE_OPTIONS = { capture: true, passive: true } as const

export type GoogleIdentityStatus =
  | 'unconfigured'
  // Le script n est pas encore demande : il attend le visiteur.
  | 'deferred'
  | 'loading'
  | 'ready'
  | 'unavailable'

export interface GoogleIdentity {
  readonly status: GoogleIdentityStatus
  readonly clientId: string
  // De quoi reclamer le script sans attendre, pour le bouton de repli : un
  // visiteur qui le vise a deja declenche `pointermove`, mais celui qui arrive
  // au clavier ou par un lecteur d ecran peut le joindre autrement.
  readonly load: () => void
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
    if (window.google) return 'ready'
    return loading ? 'loading' : 'deferred'
  })

  // Le chargement peut etre reclame par un evenement pose sur la fenetre, donc
  // depuis l exterieur du cycle de vie du composant : l etat ne se met a jour
  // que tant qu il est monte.
  const live = useRef(true)
  useEffect(() => {
    live.current = true
    return () => {
      live.current = false
    }
  }, [])

  const load = useCallback(() => {
    if (!CLIENT_ID) return

    if (window.google) {
      if (live.current) setStatus('ready')
      return
    }

    if (live.current) setStatus('loading')

    loadScript().then(
      () => {
        if (live.current) setStatus(window.google ? 'ready' : 'unavailable')
      },
      () => {
        if (live.current) setStatus('unavailable')
      },
    )
  }, [])

  useEffect(() => {
    if (!CLIENT_ID) return

    // Deja charge, ou deja demande par une visite precedente de la page : il n y
    // a plus rien a attendre.
    if (window.google || loading) {
      load()
      return
    }

    const wake = () => {
      stop()
      load()
    }

    const stop = () => {
      for (const name of WAKE) window.removeEventListener(name, wake, WAKE_OPTIONS)
    }

    for (const name of WAKE) window.addEventListener(name, wake, WAKE_OPTIONS)
    return stop
  }, [load])

  return { status, clientId: CLIENT_ID, load }
}
