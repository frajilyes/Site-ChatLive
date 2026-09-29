import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { Logo } from '../components/ui/Logo'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { useSite } from '../hooks/useSite'
import { formatCount, formatMetric, plural } from '../lib/format'
import '../styles/pages/press.css'

const BRAND_COLORS = [
  { id: 'brand-500', label: 'Main orange', value: '#ff6a00' },
  { id: 'brand-300', label: 'Light orange', value: '#ffa662' },
  { id: 'ink-950', label: 'Ink', value: '#050506' },
  { id: 'white', label: 'White', value: '#ffffff' },
] as const

export default function PressPage() {
  const { content, values, status } = useSite()
  const { site, milestones, offices } = content

  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(id)
      window.setTimeout(
        () => setCopied((current) => (current === id ? null : current)),
        1800,
      )
    } catch {
      setCopied(null)
    }
  }

  const facts = [
    { id: 'name', label: 'Name', value: site.name },
    { id: 'members', label: 'Registered members', value: formatCount(values.users) },
    { id: 'countries', label: 'Countries represented', value: formatCount(values.countries) },
    {
      id: 'availability',
      label: 'Measured uptime',
      value: `${formatMetric(status.availability, 2)}%`,
    },
    ...(site.founded
      ? [{ id: 'founded', label: 'Year founded', value: String(site.founded) }]
      : []),
    ...(site.email
      ? [{ id: 'contact', label: 'Press contact', value: site.email }]
      : []),
  ]

  return (
    <Page
      description={`${site.name} press kit: official description, measured figures, timeline and dedicated contact.`}
      background="aurora"
    >
      <PageHero
        eyebrow="Press"
        title={
          <>
            Press <span className="gradient-text">kit</span>
          </>
        }
        description="Everything you need to write about us without having to call us — and how to reach us if you prefer."
      >
        <div className="page-hero__actions">
          <Link to="/contact?subject=Press" className="btn btn--primary btn--lg">
            Contact us
            <Icon name="arrow-right" size={18} />
          </Link>
          <button
            type="button"
            className="btn btn--ghost btn--lg"
            onClick={() => copy('pitch', site.description)}
          >
            <Icon name={copied === 'pitch' ? 'check' : 'tag'} size={17} />
            {copied === 'pitch' ? 'Description copied' : 'Copy the description'}
          </button>
        </div>
      </PageHero>

      <section className="section">
        <div className="container container--narrow">
          <Reveal>
            <article className="card press__pitch">
              <h2>Official description</h2>
              <p className="press__tagline">{site.tagline}</p>
              <p>{site.description}</p>
              {site.legalNote && <p className="press__legal">{site.legalNote}</p>}
            </article>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">
              <span className="dot" />
              Key figures
            </span>
            <h2>Measured as you read</h2>
            <p>
              Click a value to copy it. They come from the same source as the{' '}
              <Link to="/status">Service status</Link> page.
            </p>
          </div>

          <ul className="press__facts">
            {facts.map((fact, index) => (
              <Reveal as="li" key={fact.id} delay={index * 60}>
                <button
                  type="button"
                  className={`card card--hover press__fact${copied === fact.id ? ' is-copied' : ''}`}
                  onClick={() => copy(fact.id, fact.value)}
                >
                  <span className="press__fact-label">{fact.label}</span>
                  <strong className="press__fact-value">{fact.value}</strong>
                  <span className="press__fact-hint">
                    <Icon name={copied === fact.id ? 'check' : 'plus'} size={14} />
                    {copied === fact.id ? 'Copied' : 'Copy'}
                  </span>
                </button>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <Reveal className="split__col">
            <span className="eyebrow">
              <span className="dot" />
              Visual identity
            </span>
            <h2>Logo and colors</h2>
            <p className="split__lead">
              The logo works on dark and light backgrounds. Please do not distort it,
              recolor it or insert it into a sentence.
            </p>

            <div className="press__logos">
              <div className="press__logo press__logo--dark">
                <Logo size={44} name={site.name} />
              </div>
              <div className="press__logo press__logo--light">
                <Logo size={44} name={site.name} />
              </div>
            </div>
          </Reveal>

          <Reveal className="split__col" delay={140}>
            <ul className="press__colors">
              {BRAND_COLORS.map((color) => (
                <li key={color.id}>
                  <button
                    type="button"
                    className={`press__color${copied === color.id ? ' is-copied' : ''}`}
                    onClick={() => copy(color.id, color.value)}
                  >
                    <span
                      className="press__color-chip"
                      style={{ background: color.value }}
                      aria-hidden="true"
                    />
                    <span className="press__color-text">
                      <strong>{color.label}</strong>
                      <small>{copied === color.id ? 'Copied' : color.value}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {milestones.length > 0 && (
        <section className="section">
          <div className="container container--narrow">
            <div className="section-head">
              <span className="eyebrow">
                <span className="dot" />
                Milestones
              </span>
              <h2>
                {offices.length > 0
                  ? `Across ${offices.length} ${plural(offices.length, 'time zone')}`
                  : 'The public milestones of the product'}
              </h2>
            </div>

            <ol className="timeline">
              {milestones.map((milestone, index) => (
                <Reveal
                  as="li"
                  key={milestone.id}
                  delay={index * 80}
                  className="timeline__item"
                >
                  <span className="timeline__year">{milestone.year}</span>
                  <div className="timeline__body">
                    <h3>{milestone.title}</h3>
                    <p>{milestone.description}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}
    </Page>
  )
}
