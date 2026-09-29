import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { NavItem } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { useSite } from '../../hooks/useSite'
import { useTheme } from '../../hooks/useTheme'
import { canAccess, roleLabel } from '../../lib/roles'
import { Icon } from '../ui/Icon'
import { Logo } from '../ui/Logo'

function isCurrentBranch(item: NavItem, pathname: string): boolean {
  if (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)) return true
  return (item.children ?? []).some((child) => child.to === pathname)
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [account, setAccount] = useState(false)
  const [menuPath, setMenuPath] = useState('')
  const [submenu, setSubmenu] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState<string | null>(null)
  const [drawerUsed, setDrawerUsed] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { content } = useSite()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const accountRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)

  if (menuPath !== pathname) {
    setMenuPath(pathname)
    if (open) setOpen(false)
    if (account) setAccount(false)
    if (submenu) setSubmenu(null)
    const branch = content.nav.find((item) => isCurrentBranch(item, pathname))
    setDrawerOpen(branch?.children?.length ? branch.id : null)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!account) return

    const onPointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccount(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccount(false)
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [account])

  useEffect(() => {
    if (!submenu) return

    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setSubmenu(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSubmenu(null)
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [submenu])

  const signOut = () => {
    logout()
    setAccount(false)
    setOpen(false)
    navigate('/')
  }

  return (
    <>
      <a className="skip-link" href="#contenu">
        Skip to main content
      </a>

      <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="container navbar__inner">
          <Link to="/" className="navbar__brand" aria-label={`${content.site.name} - home`}>
            <Logo size={36} name={content.site.name} />
          </Link>

          <nav className="navbar__nav" aria-label="Main navigation" ref={navRef}>
            <ul className="navbar__list">
              {content.nav.map((item) => {
                const children = item.children ?? []
                const hasMenu = children.length > 0
                const branch = isCurrentBranch(item, pathname)
                const expanded = submenu === item.id

                return (
                  <li
                    key={item.path}
                    className={`navbar__item${hasMenu ? ' has-menu' : ''}`}
                    onMouseEnter={hasMenu ? () => setSubmenu(item.id) : undefined}
                    onMouseLeave={hasMenu ? () => setSubmenu(null) : undefined}
                  >
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `navbar__link${isActive ? ' is-active' : ''}${
                          !isActive && branch ? ' is-branch' : ''
                        }`
                      }
                    >
                      <span>{item.label}</span>
                    </NavLink>

                    {hasMenu && (
                      <>
                        <button
                          type="button"
                          className={`navbar__caret${expanded ? ' is-open' : ''}`}
                          onClick={() => setSubmenu(expanded ? null : item.id)}
                          aria-expanded={expanded}
                          aria-controls={`sous-menu-${item.id}`}
                          aria-label={`${expanded ? 'Close' : 'Open'} the ${item.label} menu`}
                        >
                          <Icon name="arrow-right" size={13} />
                        </button>

                        <ul
                          className="navbar__submenu"
                          id={`sous-menu-${item.id}`}
                          hidden={!expanded}
                        >
                          {children.map((child) => (
                            <li key={child.to}>
                              <NavLink
                                to={child.to}
                                className={({ isActive }) =>
                                  `navbar__sublink${isActive ? ' is-active' : ''}`
                                }
                              >
                                {child.label}
                                <Icon name="arrow-right" size={14} />
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="navbar__actions">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
              }
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>

            {user ? (
              <div className="account" ref={accountRef}>
                <button
                  type="button"
                  className={`account__trigger${account ? ' is-open' : ''}`}
                  onClick={() => setAccount((value) => !value)}
                  aria-expanded={account}
                  aria-controls="menu-compte"
                  aria-haspopup="menu"
                >
                  <span className="avatar avatar--sm presence presence--online">
                    {user.initials}
                  </span>
                  <span className="account__name">{user.name}</span>
                  <Icon name="arrow-right" size={15} className="account__caret" />
                </button>

                <div
                  className="account__menu"
                  id="menu-compte"
                  role="menu"
                  hidden={!account}
                >
                  <div className="account__head">
                    <span className="avatar">{user.initials}</span>
                    <span className="account__identity">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                      <span className="flag">{user.flag}</span>
                      {canAccess(user, 'moderator') && (
                        <span className="account__role">{roleLabel(user.role)}</span>
                      )}
                    </span>
                  </div>

                  <NavLink
                    to="/chat"
                    className={({ isActive }) =>
                      `account__item${isActive ? ' is-active' : ''}`
                    }
                    role="menuitem"
                  >
                    <Icon name="chat" size={17} />
                    My chat
                  </NavLink>
                  <NavLink
                    to="/communities"
                    className={({ isActive }) =>
                      `account__item${isActive ? ' is-active' : ''}`
                    }
                    role="menuitem"
                  >
                    <Icon name="globe" size={17} />
                    My communities
                  </NavLink>
                  {canAccess(user, 'moderator') && (
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        `account__item${isActive ? ' is-active' : ''}`
                      }
                      role="menuitem"
                    >
                      <Icon name="sparkles" size={17} />
                      Administration
                    </NavLink>
                  )}
                  <button
                    type="button"
                    className="account__item account__item--danger"
                    role="menuitem"
                    onClick={signOut}
                  >
                    <Icon name="log-out" size={17} />
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `btn btn--ghost btn--sm navbar__login${isActive ? ' is-active' : ''}`
                  }
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `btn btn--primary btn--sm navbar__cta${isActive ? ' is-active' : ''}`
                  }
                >
                  Join
                  <Icon name="arrow-right" size={16} />
                </NavLink>
              </>
            )}

            <button
              type="button"
              className={`icon-btn navbar__burger${open ? ' is-open' : ''}`}
              onClick={() => {
                setDrawerUsed(true)
                setOpen((value) => !value)
              }}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              <Icon name={open ? 'close' : 'menu'} size={20} />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`drawer${open ? ' is-open' : ''}`}
        id="menu-mobile"
        hidden={!open}
      >
        {drawerUsed && (
          <>
          <button
            type="button"
            className="drawer__scrim"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <nav className="drawer__panel" aria-label="Mobile navigation">
            {user && (
              <div className="drawer__account">
                <span className="avatar presence presence--online">{user.initials}</span>
                <span className="account__identity">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </span>
              </div>
            )}

            <ul className="drawer__list">
              {content.nav.map((item, index) => {
                const children = item.children ?? []
                const hasMenu = children.length > 0
                const expanded = drawerOpen === item.id

                return (
                  <li key={item.path} style={{ '--i': index } as CSSProperties}>
                    <div className="drawer__row">
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                          `drawer__link${isActive ? ' is-active' : ''}${
                            !isActive && isCurrentBranch(item, pathname) ? ' is-branch' : ''
                          }`
                        }
                      >
                        <span className="drawer__icon">
                          <Icon name={item.icon} size={18} />
                        </span>
                        <span className="drawer__text">
                          <strong>{item.label}</strong>
                          <small>{item.description}</small>
                        </span>
                        <Icon name="arrow-right" size={16} />
                      </NavLink>

                      {hasMenu && (
                        <button
                          type="button"
                          className={`drawer__toggle${expanded ? ' is-open' : ''}`}
                          onClick={() => setDrawerOpen(expanded ? null : item.id)}
                          aria-expanded={expanded}
                          aria-controls={`tiroir-${item.id}`}
                          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.label}`}
                        >
                          <Icon name={expanded ? 'minus' : 'plus'} size={16} />
                        </button>
                      )}
                    </div>

                    {hasMenu && (
                      <ul className="drawer__sublist" id={`tiroir-${item.id}`} hidden={!expanded}>
                        {children.map((child) => (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              className={({ isActive }) =>
                                `drawer__sublink${isActive ? ' is-active' : ''}`
                              }
                            >
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="drawer__footer">
              {user ? (
                <>
                  <Link to="/chat" className="btn btn--primary btn--block">
                    Open my chat
                  </Link>
                  {canAccess(user, 'moderator') && (
                    <Link to="/admin" className="btn btn--ghost btn--block">
                      <Icon name="sparkles" size={17} />
                      Administration
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn btn--ghost btn--block"
                    onClick={signOut}
                  >
                    <Icon name="log-out" size={17} />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn--primary btn--block">
                    Create an account
                  </Link>
                  <Link to="/login" className="btn btn--ghost btn--block">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </nav>
          </>
        )}
      </div>
    </>
  )
}
