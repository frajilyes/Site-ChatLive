import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { useSite } from '../hooks/useSite'
import { API_URL } from '../lib/api'
import { plural } from '../lib/format'
import '../styles/backgrounds/grid.css'
import '../styles/pages/apidocs.css'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'
type Access = 'public' | 'member' | 'admin'

interface Endpoint {
  readonly method: Method
  readonly path: string
  readonly summary: string
  readonly access: Access
}

interface Group {
  readonly id: string
  readonly title: string
  readonly base: string
  readonly intro: string
  readonly endpoints: readonly Endpoint[]
}

const GROUPS: readonly Group[] = [
  {
    id: 'auth',
    title: 'Authentication',
    base: '/api/auth',
    intro:
      'Sign-up, address verification, then sign-in. The response carries a token to send back in the Authorization header.',
    endpoints: [
      { method: 'POST', path: '/register', summary: 'Create an account (inactive until verified)', access: 'public' },
      { method: 'POST', path: '/verify', summary: 'Activate the account with the code received by email', access: 'public' },
      { method: 'POST', path: '/verify/resend', summary: 'Resend a verification code', access: 'public' },
      { method: 'POST', path: '/login', summary: 'Open a session and get a token', access: 'public' },
      { method: 'POST', path: '/google', summary: 'Sign in with Google identity', access: 'public' },
      { method: 'GET', path: '/me', summary: 'The account linked to the token', access: 'member' },
      { method: 'POST', path: '/logout', summary: 'Close the current session', access: 'member' },
      { method: 'POST', path: '/logout-all', summary: 'Close sessions on all devices', access: 'member' },
    ],
  },
  {
    id: 'rooms',
    title: 'Rooms and messages',
    base: '/api/rooms',
    intro:
      'The whole chat: rooms, members, message thread. These routes require a token, just as the /chat page requires a session.',
    endpoints: [
      { method: 'GET', path: '/', summary: 'The rooms you are a member of', access: 'member' },
      { method: 'GET', path: '/discover', summary: 'Public rooms to join', access: 'member' },
      { method: 'POST', path: '/', summary: 'Create a room', access: 'member' },
      { method: 'GET', path: '/:id', summary: 'Room details', access: 'member' },
      { method: 'PUT', path: '/:id', summary: 'Edit a room', access: 'member' },
      { method: 'DELETE', path: '/:id', summary: 'Delete a room', access: 'member' },
      { method: 'GET', path: '/:id/members', summary: 'Members of a room', access: 'member' },
      { method: 'POST', path: '/:id/members', summary: 'Invite a member', access: 'member' },
      { method: 'POST', path: '/:id/join', summary: 'Join a public room', access: 'member' },
      { method: 'DELETE', path: '/:id/leave', summary: 'Leave a room', access: 'member' },
      { method: 'POST', path: '/:id/read', summary: 'Mark the room as read', access: 'member' },
      { method: 'GET', path: '/:roomId/messages', summary: 'The message thread', access: 'member' },
    ],
  },
  {
    id: 'messages',
    title: 'Messages',
    base: '/api/messages',
    intro: 'Editing and removing a message already sent, by its author.',
    endpoints: [
      { method: 'PUT', path: '/:id', summary: 'Edit your message', access: 'member' },
      { method: 'DELETE', path: '/:id', summary: 'Delete your message', access: 'member' },
    ],
  },
  {
    id: 'users',
    title: 'Accounts',
    base: '/api/users',
    intro: 'Profile, presence and directory. All these routes require a token.',
    endpoints: [
      { method: 'GET', path: '/countries', summary: 'List of available countries', access: 'member' },
      { method: 'GET', path: '/profile', summary: 'Your profile', access: 'member' },
      { method: 'PUT', path: '/profile', summary: 'Edit your profile', access: 'member' },
      { method: 'PUT', path: '/password', summary: 'Change password', access: 'member' },
      { method: 'PUT', path: '/presence', summary: 'Set your presence', access: 'member' },
      { method: 'GET', path: '/search', summary: 'Search for a member', access: 'member' },
      { method: 'GET', path: '/all', summary: 'All accounts', access: 'admin' },
      { method: 'PUT', path: '/:id/role', summary: 'Change an account role', access: 'admin' },
      { method: 'DELETE', path: '/:id', summary: 'Delete an account', access: 'admin' },
    ],
  },
  {
    id: 'public',
    title: 'Public content',
    base: '/api',
    intro:
      'What the site itself loads on startup: editorial content, measured figures, chat preview, communities and published testimonials.',
    endpoints: [
      { method: 'GET', path: '/site', summary: 'All the site editorial content', access: 'public' },
      { method: 'GET', path: '/site/content/:section', summary: 'A content section', access: 'public' },
      { method: 'GET', path: '/stats', summary: 'Figures and service status, measured on request', access: 'public' },
      { method: 'GET', path: '/showcase', summary: 'Public chat preview', access: 'public' },
      { method: 'GET', path: '/communities', summary: 'Community directory', access: 'public' },
      { method: 'GET', path: '/communities/topics', summary: 'Directory topics', access: 'public' },
      { method: 'GET', path: '/testimonials', summary: 'Published testimonials', access: 'public' },
    ],
  },
  {
    id: 'forms',
    title: 'Forms',
    base: '/api',
    intro: 'The site submissions: contact message and monthly newsletter subscription.',
    endpoints: [
      { method: 'GET', path: '/contact/subjects', summary: 'Subjects accepted by the form', access: 'public' },
      { method: 'POST', path: '/contact', summary: 'Send a message to the team', access: 'public' },
      { method: 'POST', path: '/newsletter', summary: 'Subscribe to the monthly newsletter', access: 'public' },
      { method: 'DELETE', path: '/newsletter/:email', summary: 'Unsubscribe (your own address)', access: 'member' },
      { method: 'POST', path: '/testimonials', summary: 'Submit your testimonial', access: 'member' },
    ],
  },
]

export default function ApiDocsPage() {
  const { content } = useSite()
  const [access, setAccess] = useState<Access | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        endpoints: access
          ? group.endpoints.filter((endpoint) => endpoint.access === access)
          : group.endpoints,
      })).filter((group) => group.endpoints.length > 0),
    [access],
  )

  const total = filtered.reduce((sum, group) => sum + group.endpoints.length, 0)

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(id)
      window.setTimeout(
        () => setCopied((current) => (current === id ? null : current)),
        1600,
      )
    } catch {
      setCopied(null)
    }
  }

  const filters: readonly { readonly id: Access | null; readonly label: string }[] = [
    { id: null, label: 'All' },
    { id: 'public', label: 'No token' },
    { id: 'member', label: 'Signed-in member' },
    { id: 'admin', label: 'Administrator' },
  ]

  return (
    <Page
      description={`The HTTP endpoints of ${content.site.name}: authentication, rooms, messages, public content and forms.`}
      background="grid"
    >
      <PageHero
        eyebrow="Resources"
        title={
          <>
            API <span className="gradient-text">documentation</span>
          </>
        }
        description="Every route the server exposes, with the access level required. The site itself uses nothing else."
      >
        <div className="page-hero__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => copy('base', API_URL)}
          >
            <Icon name={copied === 'base' ? 'check' : 'plus'} size={17} />
            {copied === 'base' ? 'Address copied' : `Copy ${API_URL}`}
          </button>
          <Link to="/contact" className="btn btn--ghost">
            Request access
          </Link>
        </div>
      </PageHero>

      <section className="section">
        <div className="container container--narrow">
          <Reveal>
            <div className="card api__auth">
              <span className="feature__icon">
                <Icon name="lock" size={20} />
              </span>
              <div>
                <h2>Authentication</h2>
                <p>
                  Routes marked “member” or “admin” expect the token returned by{' '}
                  <code>POST /api/auth/login</code>, in the header:
                </p>
                <code className="api__code">Authorization: Bearer &lt;token&gt;</code>
                <p className="api__note">
                  An expired token closes the session: the response is a 401, and the site
                  redirects to the sign-in page.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container container--narrow">
          <ul className="filters__topics">
            {filters.map((filter) => (
              <li key={filter.label}>
                <button
                  type="button"
                  className={`chip${access === filter.id ? ' is-active' : ''}`}
                  aria-pressed={access === filter.id}
                  onClick={() => setAccess(filter.id)}
                >
                  {filter.label}
                </button>
              </li>
            ))}
          </ul>

          <p className="filters__summary" role="status">
            <strong>{total}</strong> {plural(total, 'route')} shown
          </p>

          {filtered.map((group) => (
            <Reveal key={group.id} className="api__group">
              <h2 className="api__group-title">
                {group.title}
                <code>{group.base}</code>
              </h2>
              <p className="api__group-intro">{group.intro}</p>

              <ul className="api__list">
                {group.endpoints.map((endpoint) => {
                  const full = `${API_URL}${group.base === '/api' ? '' : group.base}${endpoint.path === '/' ? '' : endpoint.path}`
                  const id = `${endpoint.method}-${group.id}-${endpoint.path}`
                  return (
                    <li key={id} className="api__endpoint">
                      <span className={`api__method api__method--${endpoint.method.toLowerCase()}`}>
                        {endpoint.method}
                      </span>
                      <code className="api__path">
                        {group.base === '/api' ? '/api' : group.base}
                        {endpoint.path === '/' ? '' : endpoint.path}
                      </code>
                      <span className="api__summary">{endpoint.summary}</span>
                      <span className={`api__access api__access--${endpoint.access}`}>
                        {endpoint.access}
                      </span>
                      <button
                        type="button"
                        className="icon-btn api__copy"
                        aria-label={`Copy the address of ${endpoint.method} ${endpoint.path}`}
                        onClick={() => copy(id, full)}
                      >
                        <Icon name={copied === id ? 'check' : 'plus'} size={15} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="cta cta--soft">
              <div className="cta__content">
                <h2>Real time</h2>
                <p>
                  Messages do not go through these routes: they travel over a Socket.IO
                  connection opened after authentication. Write to us if you want to plug a
                  client into it.
                </p>
                <div className="cta__actions">
                  <Link to="/contact" className="btn btn--primary btn--lg">
                    Write to us
                    <Icon name="arrow-right" size={18} />
                  </Link>
                  <Link to="/status" className="btn btn--ghost btn--lg">
                    See uptime
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </Page>
  )
}
