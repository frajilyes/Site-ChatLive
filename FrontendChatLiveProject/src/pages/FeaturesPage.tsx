import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { FeatureGrid } from '../components/home/FeatureGrid'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { useSite } from '../hooks/useSite'
import { formatMetric } from '../lib/format'
import '../styles/backgrounds/mesh.css'
import '../styles/pages/features.css'

export default function FeaturesPage() {
  const { content, metrics, status } = useSite()
  const { features, securityPoints, securityRows, platforms } = content

  return (
    <Page
      description="Real time, live presence, each member's language, closed rooms: all of ChatLive's features, and the measured figures that go with them."
      background="mesh"
    >
      <PageHero
        eyebrow="Features"
        title={
          <>
            Everything you need to <span className="gradient-text">really talk</span>
          </>
        }
        description="A platform built for conversations between friends: fast, understandable in everyone's language, and closed to those who were not invited."
      >
        <div className="page-hero__actions">
          <Link to="/chat" className="btn btn--primary btn--lg">
            Try it now
            <Icon name="arrow-right" size={18} />
          </Link>
          <Link to="/pricing" className="btn btn--ghost btn--lg">
            See pricing
          </Link>
        </div>
      </PageHero>

      <section className="section">
        <div className="container">
          <FeatureGrid features={features} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">
              <span className="dot" />
              Performance
            </span>
            <h2>Verifiable figures, not promises</h2>
            <p>
              These indicators are measured by the server itself and re-read every time
              this page loads. The{' '}
              <Link to="/status">Service status</Link> page tracks them continuously.
            </p>
          </div>

          <ul className="metrics">
            {metrics.map((item, index) => (
              <Reveal as="li" key={item.id} delay={index * 90}>
                <Link to="/status" className="card card--hover metric metric--link">
                  <strong className="metric__value">
                    {formatMetric(item.value, item.precision)}
                    {item.suffix}
                  </strong>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                  <span className="metric__go">
                    Follow live
                    <Icon name="arrow-right" size={14} />
                  </span>
                </Link>
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
              Privacy
            </span>
            <h2>Your conversations belong only to you</h2>
            <p className="split__lead">
              {content.site.name} shows no ads. We have neither interest nor reason to read
              what you write.
            </p>
            <ul className="checklist">
              {securityPoints.map((line) => (
                <li key={line.id}>
                  <span className="checklist__icon">
                    <Icon name="check" size={14} />
                  </span>
                  {line.text}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="split__col" delay={140}>
            <div className="card panel">
              <header className="panel__head">
                <span className="feature__icon">
                  <Icon name="shield" size={22} />
                </span>
                <div>
                  <h3>Security log</h3>
                  <p>Mechanisms in place on this server</p>
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
              </ul>
              <Link to="/security" className="btn btn--ghost btn--sm btn--block">
                Security measures in detail
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">
              <span className="dot" />
              Available everywhere
            </span>
            <h2>One conversation, all your screens</h2>
            <p>
              Start a message on mobile, finish it on your computer: your session and
              rooms follow you.
            </p>
          </div>

          <ul className="platforms">
            {platforms.map((platform, index) => (
              <Reveal as="li" key={platform.id} delay={index * 80}>
                <Link to="/chat" className="card card--hover platform platform--link">
                  <span className="feature__icon">
                    <Icon name="device" size={20} />
                  </span>
                  <h3>{platform.label}</h3>
                  <p>{platform.detail}</p>
                  <span className="platform__go">
                    Open here
                    <Icon name="arrow-right" size={14} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </Page>
  )
}
