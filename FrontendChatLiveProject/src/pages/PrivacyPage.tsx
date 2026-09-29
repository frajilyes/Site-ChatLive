import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { LegalDoc, type LegalSection } from '../components/ui/LegalDoc'
import { PageHero } from '../components/ui/PageHero'
import { useSite } from '../hooks/useSite'
import { openCookiePreferences } from '../lib/cookie-consent'
import '../styles/backgrounds/grid.css'
import '../styles/pages/privacy.css'

const UPDATED = 'September 2026'

export default function PrivacyPage() {
  const { content } = useSite()
  const { site, securityPoints } = content

  const sections: LegalSection[] = [
    {
      id: 'data',
      title: 'The data we keep',
      body: (
        <>
          <p>
            A {site.name} account holds very little: a display name, an email address,
            an encrypted password, a country and a language. On top of that comes what you
            write — your messages and the rooms you are a member of.
          </p>
          <ul className="doc__list">
            <li>
              <strong>Account</strong>: name, email, encrypted password, country, language,
              sign-up date, last sign-in.
            </li>
            <li>
              <strong>Conversations</strong>: the content of your messages, their timestamps
              and the room they belong to.
            </li>
            <li>
              <strong>Contact form</strong>: name, email, subject and message, for as long
              as it takes to reply.
            </li>
            <li>
              <strong>Monthly newsletter</strong>: your email address, until you
              unsubscribe.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'usage',
      title: 'What we do with it',
      body: (
        <>
          <p>
            This data is used to run the service, and nothing else: showing your rooms,
            delivering your messages to the people you talk to, verifying your address at
            sign-up, and replying when you write to us.
          </p>
          <ul className="checklist">
            {securityPoints.map((point) => (
              <li key={point.id}>
                <span className="checklist__icon">
                  <Icon name="check" size={14} />
                </span>
                {point.text}
              </li>
            ))}
          </ul>
          <p>
            {site.name} lives off its subscriptions. We sell no data, we rent none, and no
            ad network has access to this database.
          </p>
        </>
      ),
    },
    {
      id: 'retention',
      title: 'How long',
      body: (
        <>
          <p>
            Your messages remain as long as the room exists: they belong to you, not to
            us. Other data is kept for short periods.
          </p>
          <ul className="doc__list">
            <li>
              <strong>Deleted account</strong>: data erased, with no copy kept.
            </li>
            <li>
              <strong>Verification code</strong>: a few minutes, then it expires.
            </li>
            <li>
              <strong>Contact message</strong>: while it is handled, then archived.
            </li>
            <li>
              <strong>Uptime records</strong>: aggregated figures, with nothing that
              identifies you (see the <Link to="/status">Service status</Link> page).
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'rights',
      title: 'Your rights',
      body: (
        <>
          <p>
            You can view, correct or have erased anything that concerns you. A written
            request{' '}
            {site.email ? (
              <>
                to <a href={`mailto:${site.email}`}>{site.email}</a>
              </>
            ) : (
              <>
                through the <Link to="/contact">contact form</Link>
              </>
            )}{' '}
            is enough.
          </p>
          <p>
            Deleting your account erases your profile. Messages you have already sent in a
            room remain readable by its members: ask for them explicitly in the same
            request if you want them removed too.
          </p>
        </>
      ),
    },
    {
      id: 'cookies',
      title: 'Cookies and trackers',
      body: (
        <>
          <p>
            The site sets no analytics or advertising cookies: your session and settings
            live in your browser's local storage. The three optional categories
            (preferences, audience measurement, advertising) still wait for your answer,
            and you can change it at any time.
          </p>
          <p>
            <button type="button" className="btn btn--ghost" onClick={openCookiePreferences}>
              <Icon name="shield" size={16} />
              Open my cookie preferences
            </button>
          </p>
        </>
      ),
    },
    {
      id: 'contact',
      title: 'Contact us',
      body: (
        <p>
          For any question about this document:{' '}
          {site.email && (
            <>
              <a href={`mailto:${site.email}`}>{site.email}</a>, or through the{' '}
            </>
          )}
          <Link to="/contact">contact form</Link>.
          {site.legalNote && ` ${site.legalNote}`}
        </p>
      ),
    },
  ]

  return (
    <Page
      description={`What ${site.name} collects, why, for how long, and how to take back control of your data.`}
      background="grid"
    >
      <PageHero
        eyebrow="Legal"
        title={
          <>
            Privacy <span className="gradient-text">policy</span>
          </>
        }
        description="A short text, because there is not much to declare: we keep the minimum, and you can take it all back."
      />

      <section className="section">
        <LegalDoc
          sections={sections}
          updated={UPDATED}
          aside={
            <Link to="/security" className="btn btn--ghost btn--sm btn--block">
              See the security measures
              <Icon name="arrow-right" size={15} />
            </Link>
          }
        />
      </section>
    </Page>
  )
}
