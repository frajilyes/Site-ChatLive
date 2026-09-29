import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSite } from '../../hooks/useSite'
import type { FooterLink } from '../../types'
import { ApiError, newsletterApi } from '../../lib/api'
import { openCookiePreferences } from '../../lib/cookie-consent'
import { formatMetric } from '../../lib/format'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'

type NewsState = 'idle' | 'sending' | 'done' | 'error'

function isCookieLink(link: FooterLink): boolean {
  return link.to === '/cookies' || /cookies?/i.test(link.label)
}

function safeHref(url: string): string {
  return /^(https?:\/\/|mailto:|tel:)/i.test(url.trim()) ? url : '#'
}

export function Footer() {
  const { content, status } = useSite()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<NewsState>('idle')
  const [notice, setNotice] = useState<string | null>(null)

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (state === 'sending') return

    setState('sending')
    try {
      const response = await newsletterApi.subscribe(email.trim().toLowerCase())
      setNotice(response.message)
      setState('done')
      setEmail('')
    } catch (error) {
      setNotice(
        error instanceof ApiError
          ? error.message
          : 'Subscription unavailable right now.',
      )
      setState('error')
    }
  }

  return (
    <footer className="footer">
      <div className="footer__glow" aria-hidden="true" />

      <div className="container footer__inner">
        <div className="footer__brand">
          <Logo size={38} name={content.site.name} />
          <p className="footer__pitch">{content.site.description}</p>

          <form className="footer__news" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="footer-email">
              Email address
            </label>
            <div className="footer__field">
              <Icon name="mail" size={17} />
              <input
                id="footer-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn--primary btn--sm"
                disabled={state === 'sending'}
              >
                {state === 'sending' ? 'Sending...' : 'Subscribe'}
              </button>
            </div>
            <p
              className={`footer__news-note${state === 'done' ? ' is-done' : ''}`}
              role="status"
            >
              {notice ?? 'One letter a month: product news, no ads.'}
            </p>
          </form>

          {content.social.length > 0 && (
            <ul className="footer__socials">
              {content.social.map((social) => (
                <li key={social.id}>
                  <a
                    href={safeHref(social.href)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="icon-btn"
                    aria-label={social.label}
                  >
                    <Icon name={social.icon} size={18} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="footer__columns" aria-label="Footer links">
          {content.footer.map((column) => (
            <div key={column.id} className="footer__col">
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={`${column.id}-${link.label}`}>
                    {isCookieLink(link) ? (
                      <button
                        type="button"
                        className="footer__link-btn"
                        onClick={openCookiePreferences}
                      >
                        {link.label}
                      </button>
                    ) : link.external ? (
                      <a
                        href={safeHref(link.to)}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="footer__link"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <NavLink
                        to={link.to}
                        end={link.to === '/'}
                        className={({ isActive }) =>
                          `footer__link${isActive ? ' is-active' : ''}`
                        }
                      >
                        {link.label}
                      </NavLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="container footer__bottom">
        <p>
          &copy; {new Date().getFullYear()} {content.site.name}. Designed to bring friends
          together, anywhere in the world.
        </p>
        <NavLink
          to="/status"
          className={({ isActive }) =>
            `footer__status${status.ok ? '' : ' is-down'}${isActive ? ' is-active' : ''}`
          }
        >
          <span className="footer__status-dot" />
          {status.ok
            ? `All systems operational - ${formatMetric(status.availability, 2)}% uptime`
            : 'Service disrupted'}
        </NavLink>
      </div>
    </footer>
  )
}
