import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ACCEPT_ALL,
  REFUSE_ALL,
  applyConsent,
  onCookiePreferences,
  readConsent,
  saveConsent,
  type CookieChoices,
  type StoredConsent,
} from '../../lib/cookie-consent'
import { Icon } from '../ui/Icon'

type OptionalCategory = 'preferences' | 'analytics' | 'marketing'

interface CategoryCard {
  readonly key: OptionalCategory | 'necessary'
  readonly title: string
  readonly description: string
  readonly examples: string
}

const CATEGORIES: readonly CategoryCard[] = [
  {
    key: 'necessary',
    title: 'Strictly necessary',
    description:
      'Sign-in session and memory of this choice, kept in the browser’s local storage. The site cannot work without them: they stay active.',
    examples: 'chatlive-session, chatlive-cookie-consent (local storage)',
  },
  {
    key: 'preferences',
    title: 'Preferences',
    description:
      'Remember your display settings, in the browser’s local storage: dark or light theme, last room opened.',
    examples: 'chatlive-theme (local storage)',
  },
  {
    key: 'analytics',
    title: 'Audience measurement',
    description:
      'Would count visits in aggregate. No analytics tool is installed to date: refusing this category guarantees none will be without your consent.',
    examples: 'none to date',
  },
  {
    key: 'marketing',
    title: 'Advertising',
    description:
      'Would measure advertising campaigns. No ad network is called to date, and this category is refused by default.',
    examples: 'none to date',
  },
]

function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US')
}

export function CookieConsent() {
  const [consent, setConsent] = useState<StoredConsent | null>(readConsent)
  const [panel, setPanel] = useState(() => window.__CHATLIVE_COOKIE_PANEL__ === true)
  const [draft, setDraft] = useState<CookieChoices>(() => readConsent() ?? REFUSE_ALL)
  const dialogRef = useRef<HTMLDivElement>(null)

  const [instant] = useState(() => document.getElementById('boot') !== null)

  useEffect(() => {
    const stored = readConsent()
    if (stored) applyConsent(stored)
  }, [])

  useEffect(
    () =>
      onCookiePreferences(() => {
        setDraft(readConsent() ?? REFUSE_ALL)
        setPanel(true)
      }),
    [],
  )

  useEffect(() => {
    if (!panel) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel(false)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [panel])

  const decide = useCallback((choices: CookieChoices) => {
    setConsent(saveConsent(choices))
    setPanel(false)
  }, [])

  const toggle = (category: OptionalCategory) => {
    setDraft((current) => ({ ...current, [category]: !current[category] }))
  }

  if (consent && !panel) return null

  return (
    <>
      {!panel && (
        <section
          className={instant ? 'cookies cookies--instant' : 'cookies'}
          role="region"
          aria-labelledby="cookies-titre"
          aria-describedby="cookies-texte"
        >
          <div className="cookies__icon" aria-hidden="true">
            <Icon name="shield" size={20} />
          </div>

          <div className="cookies__text">
            <h2 id="cookies-titre">Your privacy</h2>
            <p id="cookies-texte">
              Only the cookies needed for the site to work have been set. The others —
              preferences, audience measurement, advertising — wait for your consent.
            </p>
          </div>

          <div className="cookies__actions">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setDraft(consent ?? REFUSE_ALL)
                setPanel(true)
              }}
            >
              Customize
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => decide(REFUSE_ALL)}
            >
              Reject all
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => decide(ACCEPT_ALL)}
            >
              Accept all
            </button>
          </div>
        </section>
      )}

      {panel && (
        <div className="cookies__overlay" role="presentation" onClick={() => setPanel(false)}>
          <div
            ref={dialogRef}
            className="cookies__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookies-panel-titre"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="cookies__panel-head">
              <div>
                <h2 id="cookies-panel-titre">Cookie settings</h2>
                <p>
                  Each category can be refused separately. You can change this choice at any time
                  from the “Cookies” link in the footer.
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPanel(false)}
                aria-label="Close settings"
              >
                <Icon name="close" size={18} />
              </button>
            </header>

            <ul className="cookies__list">
              {CATEGORIES.map((category) => {
                const locked = category.key === 'necessary'
                const active = locked || draft[category.key]

                return (
                  <li key={category.key} className="cookies__item">
                    <div className="cookies__item-text">
                      <h3>{category.title}</h3>
                      <p>{category.description}</p>
                      <p className="cookies__examples">Set: {category.examples}</p>
                    </div>

                    <label className={`cookies__switch${active ? ' is-on' : ''}`}>
                      <span className="sr-only">
                        {locked
                          ? `${category.title}: always active`
                          : `Enable ${category.title} cookies`}
                      </span>
                      <input
                        type="checkbox"
                        checked={active}
                        disabled={locked}
                        onChange={() => {
                          if (!locked) toggle(category.key as OptionalCategory)
                        }}
                      />
                      <span className="cookies__switch-track" aria-hidden="true">
                        <span className="cookies__switch-knob" />
                      </span>
                      <span className="cookies__switch-state" aria-hidden="true">
                        {locked ? 'Required' : active ? 'On' : 'Off'}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>

            <footer className="cookies__panel-foot">
              {consent && (
                <p className="cookies__stamp">
                  Last choice saved on {formatDate(consent.date)}.
                </p>
              )}

              <div className="cookies__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => decide(REFUSE_ALL)}
                >
                  Reject all
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => decide(ACCEPT_ALL)}
                >
                  Accept all
                </button>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => decide(draft)}
                >
                  Save my choices
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
