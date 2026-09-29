import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { useSite } from '../hooks/useSite'
import { formatMetric } from '../lib/format'
import '../styles/backgrounds/rays.css'
import '../styles/pages/security.css'

export default function SecurityPage() {
  const { content, status } = useSite()
  const { site, securityPoints, securityRows, contactChannels } = content

  const channel = contactChannels.find((item) => /securit/i.test(item.title))
  const mailbox = channel?.detail ?? site.email

  const steps = [
    {
      id: 'report',
      title: 'Write to us',
      text: mailbox
        ? `Send the details to ${mailbox}: what you found, how to reproduce it, and the impact you estimate.`
        : 'Use the contact form: what you found, how to reproduce it, and the impact you estimate.',
    },
    {
      id: 'ack',
      title: 'We acknowledge receipt',
      text: 'Every report received gets a written reply before any review.',
    },
    {
      id: 'fix',
      title: 'We fix it',
      text: 'A critical vulnerability is fixed ahead of any other ongoing work.',
    },
  ]

  return (
    <Page
      description={`The security measures in place on ${site.name} and the responsible disclosure process.`}
      background="rays"
    >
      <PageHero
        eyebrow="Security"
        title={
          <>
            What protects <span className="gradient-text">your conversations</span>
          </>
        }
        description="No list of purchased certifications: the mechanisms below are the ones the server applies to every request."
      >
        <div className="page-hero__actions">
          {mailbox ? (
            <a href={`mailto:${mailbox}`} className="btn btn--primary">
              <Icon name="shield" size={17} />
              Report a vulnerability
            </a>
          ) : (
            <Link to="/contact?subject=Security" className="btn btn--primary">
              <Icon name="shield" size={17} />
              Report a vulnerability
            </Link>
          )}
          <Link to="/privacy" className="btn btn--ghost">
            Read the privacy policy
          </Link>
        </div>
      </PageHero>

      <section className="section">
        <div className="container split">
          <Reveal className="split__col">
            <span className="eyebrow">
              <span className="dot" />
              Principles
            </span>
            <h2>Minimum data, maximum locks</h2>
            <p className="split__lead">
              The less we keep, the less there is to lose. The rest comes down to
              verifiable technical choices.
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
          </Reveal>

          <Reveal className="split__col" delay={140}>
            <div className="card panel">
              <header className="panel__head">
                <span className="feature__icon">
                  <Icon name="lock" size={22} />
                </span>
                <div>
                  <h3>Security log</h3>
                  <p>Status measured on this server</p>
                </div>
              </header>
              <ul className="panel__rows">
                {securityRows.map((row) => (
                  <li key={row.id}>
                    <span>{row.label}</span>
                    <strong className="ok">{row.value}</strong>
                  </li>
                ))}
                <li>
                  <span>Served environment</span>
                  <strong className="ok">{status.environment}</strong>
                </li>
                <li>
                  <span>Measured uptime</span>
                  <strong className="ok">
                    {formatMetric(status.availability, 2)}%
                  </strong>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container container--narrow">
          <div className="section-head">
            <span className="eyebrow">
              <span className="dot" />
              Responsible disclosure
            </span>
            <h2>Found a vulnerability?</h2>
            <p>
              Report it before publishing it: we commit to not pursuing anyone for research
              carried out in good faith, without accessing other people's data or
              degrading the service.
            </p>
          </div>

          <ol className="steps">
            {steps.map((step, index) => (
              <Reveal as="li" key={step.id} className="steps__item" delay={index * 80}>
                <span className="steps__index">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={120}>
            <div className="cta cta--soft">
              <div className="cta__content">
                <h2>A broader security question?</h2>
                <p>
                  The team also answers through the form, by choosing the
                  “Security” subject.
                </p>
                <div className="cta__actions">
                  <Link to="/contact?subject=Security" className="btn btn--primary btn--lg">
                    Open the form
                    <Icon name="arrow-right" size={18} />
                  </Link>
                  {mailbox && (
                    <a href={`mailto:${mailbox}`} className="btn btn--ghost btn--lg">
                      {mailbox}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </Page>
  )
}
