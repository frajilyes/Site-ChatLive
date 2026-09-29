import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { LegalDoc, type LegalSection } from '../components/ui/LegalDoc'
import { PageHero } from '../components/ui/PageHero'
import { useSite } from '../hooks/useSite'
import '../styles/backgrounds/waves.css'
import '../styles/pages/terms.css'

const UPDATED = 'September 2026'

export default function TermsPage() {
  const { content } = useSite()
  const { site, plans } = content

  const sections: LegalSection[] = [
    {
      id: 'purpose',
      title: 'Purpose',
      body: (
        <p>
          These terms govern the use of {site.name}, a live chat service. Creating an
          account means accepting this text. If any point seems unfair to you, write to us
          before signing up:{' '}
          {site.email ? (
            <a href={`mailto:${site.email}`}>{site.email}</a>
          ) : (
            <Link to="/contact">contact form</Link>
          )}
          .
        </p>
      ),
    },
    {
      id: 'account',
      title: 'Your account',
      body: (
        <>
          <p>
            An account belongs to one person. The email address must be valid: until the
            code received has been entered on the confirmation page, the account stays
            inactive and cannot sign in.
          </p>
          <ul className="doc__list">
            <li>You are responsible for keeping your password confidential.</li>
            <li>
              An account shared between several people may be suspended without notice.
            </li>
            <li>
              You can delete your account at any time: your data goes with it.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'usage',
      title: 'What is forbidden',
      body: (
        <>
          <p>
            The list is short and unsurprising. It exists to keep rooms livable.
          </p>
          <ul className="doc__list">
            <li>Harassment, threats, incitement to hatred or violence.</li>
            <li>Illegal content, or content published without the right to do so.</li>
            <li>
              Automated mass messaging, phishing, spreading malware.
            </li>
            <li>
              Attempting to access other people's rooms, accounts or data — see the{' '}
              <Link to="/security">Security</Link> page to report a vulnerability properly.
            </li>
          </ul>
          <p>
            A serious breach leads to the account being closed, with no refund for the
            current month.
          </p>
        </>
      ),
    },
    {
      id: 'content',
      title: 'Your conversations belong to you',
      body: (
        <p>
          We acquire no rights over what you write. Your messages remain yours: we store
          them and deliver them to the people you talk to, nothing more. We do not read
          them, analyze them or hand them over to anyone.
        </p>
      ),
    },
    {
      id: 'plans',
      title: 'Plans and payment',
      body: (
        <>
          <p>
            {plans.length === 0
              ? 'No paid plan is published: using the service currently requires neither payment nor a credit card.'
              : 'The plans in force, and only those, are the ones published on the Pricing page.'}
          </p>
          {plans.length > 0 && (
            <>
              <ul className="doc__list">
                {plans.map((plan) => (
                  <li key={plan.id}>
                    <strong>{plan.name}</strong> : {plan.tagline}
                  </li>
                ))}
              </ul>
              <p>
                <Link to="/pricing" className="btn btn--ghost btn--sm">
                  See plan details
                  <Icon name="arrow-right" size={15} />
                </Link>
              </p>
            </>
          )}
        </>
      ),
    },
    {
      id: 'service',
      title: 'Service availability',
      body: (
        <p>
          We aim for maximum availability without promising it in writing: the actual
          measurement, minute by minute, is published on the{' '}
          <Link to="/status">Service status</Link> page. Planned downtime is announced in
          advance in the rooms concerned.
        </p>
      ),
    },
    {
      id: 'modification',
      title: 'Changes to these terms',
      body: (
        <p>
          A substantive change is announced before it takes effect. If you refuse it, ask
          for your account to be deleted: the previous text applies until then.
          {site.legalNote && ` ${site.legalNote}`}
        </p>
      ),
    },
  ]

  return (
    <Page
      description={`The rules for using ${site.name}: account, content, plans, availability and termination.`}
      background="waves"
    >
      <PageHero
        eyebrow="Legal"
        title={
          <>
            Terms <span className="gradient-text">of use</span>
          </>
        }
        description="What we owe you, what we expect from you. Written to be read, not skimmed."
      />

      <section className="section">
        <LegalDoc
          sections={sections}
          updated={UPDATED}
          aside={
            <Link to="/privacy" className="btn btn--ghost btn--sm btn--block">
              Read the privacy policy
              <Icon name="arrow-right" size={15} />
            </Link>
          }
        />
      </section>
    </Page>
  )
}
