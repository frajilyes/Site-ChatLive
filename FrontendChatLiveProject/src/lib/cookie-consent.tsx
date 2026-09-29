export type CookieCategory = 'necessary' | 'preferences' | 'analytics' | 'marketing'

export interface CookieChoices {
  readonly necessary: true
  readonly preferences: boolean
  readonly analytics: boolean
  readonly marketing: boolean
}

export interface StoredConsent extends CookieChoices {
  readonly version: number
  readonly date: string
}

const STORAGE_KEY = 'chatlive-cookie-consent'

export const CONSENT_VERSION = 1

const CHANGE_EVENT = 'chatlive:cookie-consent'
const OPEN_EVENT = 'chatlive:cookie-preferences'

export const ACCEPT_ALL: CookieChoices = {
  necessary: true,
  preferences: true,
  analytics: true,
  marketing: true,
}

export const REFUSE_ALL: CookieChoices = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
}

function isStoredConsent(value: unknown): value is StoredConsent {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    candidate.necessary === true &&
    typeof candidate.preferences === 'boolean' &&
    typeof candidate.analytics === 'boolean' &&
    typeof candidate.marketing === 'boolean' &&
    candidate.version === CONSENT_VERSION
  )
}

export function readConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isStoredConsent(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveConsent(choices: CookieChoices): StoredConsent {
  const consent: StoredConsent = {
    ...choices,
    necessary: true,
    version: CONSENT_VERSION,
    date: new Date().toISOString(),
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
  } catch {}

  applyConsent(consent)
  window.dispatchEvent(new CustomEvent<StoredConsent | null>(CHANGE_EVENT, { detail: consent }))
  return consent
}

export function clearConsent(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {}
  window.dispatchEvent(new CustomEvent<StoredConsent | null>(CHANGE_EVENT, { detail: null }))
}

export function hasConsent(category: CookieCategory): boolean {
  if (category === 'necessary') return true
  const consent = readConsent()
  return consent ? consent[category] : false
}

const KNOWN_COOKIES: ReadonlyArray<readonly [RegExp, CookieCategory]> = [
  [/^chatlive-/, 'necessary'],
  [/^g_state$/, 'preferences'],
  [/^(_ga|_gid|_gat)/, 'analytics'],
  [/^(_fbp|_fbc|_gcl)/, 'marketing'],
]

function categoryOf(name: string): CookieCategory {
  for (const [pattern, category] of KNOWN_COOKIES) {
    if (pattern.test(name)) return category
  }
  return 'analytics'
}

function dropCookie(name: string): void {
  const host = window.location.hostname
  const parent = host.split('.').slice(-2).join('.')
  const expired = 'Thu, 01 Jan 1970 00:00:00 GMT'

  for (const domain of [undefined, host, `.${parent}`]) {
    const suffix = domain ? `; domain=${domain}` : ''
    document.cookie = `${name}=; expires=${expired}; path=/${suffix}`
  }
}

export function applyConsent(consent: StoredConsent): void {
  document.documentElement.dataset.cookieConsent = (
    ['preferences', 'analytics', 'marketing'] as const
  )
    .filter((category) => consent[category])
    .join(' ')

  try {
    for (const pair of document.cookie.split(';')) {
      const name = pair.split('=')[0]?.trim()
      if (!name) continue
      const category = categoryOf(name)
      if (category !== 'necessary' && !consent[category]) dropCookie(name)
    }
  } catch {}
}

export function openCookiePreferences(): void {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function onCookiePreferences(listener: () => void): () => void {
  window.addEventListener(OPEN_EVENT, listener)
  return () => window.removeEventListener(OPEN_EVENT, listener)
}

export function onConsentChange(listener: (consent: StoredConsent | null) => void): () => void {
  const handler = (event: Event) => {
    listener((event as CustomEvent<StoredConsent | null>).detail)
  }
  window.addEventListener(CHANGE_EVENT, handler)
  return () => window.removeEventListener(CHANGE_EVENT, handler)
}
