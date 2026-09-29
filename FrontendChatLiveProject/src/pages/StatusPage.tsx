import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { useSite } from '../hooks/useSite'
import { formatCount, formatMetric, plural } from '../lib/format'
import '../styles/backgrounds/pulse.css'
import '../styles/pages/status.css'

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)

  if (days > 0) return `${days} d ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${minutes} min`
}

export default function StatusPage() {
  const { content, status, metrics, values, refresh } = useSite()
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)

  const onRefresh = () => {
    refresh()
    setRefreshedAt(new Date())
  }

  const components = [
    {
      id: 'api',
      label: 'API REST',
      detail: `${status.environment} environment`,
      ok: status.ok,
    },
    {
      id: 'realtime',
      label: 'Real-time chat',
      detail: `${formatCount(values.onlineUsers)} ${plural(values.onlineUsers, 'member')} connected`,
      ok: status.ok,
    },
    {
      id: 'latency',
      label: 'Median latency',
      detail: `${formatMetric(status.latencyMs, 0)} ms on served requests`,
      ok: status.latencyMs < 400,
    },
    {
      id: 'uptime',
      label: 'Service continuity',
      detail: `Online for ${formatUptime(status.uptimeSeconds)}`,
      ok: status.availability >= 99,
    },
  ]

  const measuredAt = new Date(status.timestamp)

  return (
    <Page
      description={`Uptime, latency and component status of ${content.site.name}, measured live by the server.`}
      background="pulse"
    >
      <PageHero
        eyebrow="Status"
        title={
          <>
            Live{' '}
            <span className="gradient-text">service status</span>
          </>
        }
        description="These figures are not self-reported: the server measures them on itself every time this page is loaded."
      >
        <div className="page-hero__actions">
          <button type="button" className="btn btn--primary" onClick={onRefresh}>
            <Icon name="bolt" size={17} />
            Refresh measurements
          </button>
          <Link to="/contact" className="btn btn--ghost">
            Report an incident
          </Link>
        </div>
      </PageHero>

      <section className="section">
        <div className="container container--narrow">
          <Reveal>
            <div className={`card status-banner${status.ok ? '' : ' is-down'}`}>
              <span className="status-banner__dot" />
              <div>
                <h2>
                  {status.ok
                    ? 'All services are operational'
                    : 'Service partially disrupted'}
                </h2>
                <p>
                  Measured uptime: {formatMetric(status.availability, 2)}% — last
                  measured at{' '}
                  {measuredAt.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                  {refreshedAt && ' (refreshed on request)'}
                </p>
              </div>
              <strong className="status-banner__value">
                {formatMetric(status.availability, 2)}
                <em>%</em>
              </strong>
            </div>
          </Reveal>

          <ul className="status-list">
            {components.map((component, index) => (
              <Reveal as="li" key={component.id} delay={index * 70}>
                <div className={`card status-row${component.ok ? '' : ' is-down'}`}>
                  <span className="status-row__dot" />
                  <div className="status-row__text">
                    <strong>{component.label}</strong>
                    <small>{component.detail}</small>
                  </div>
                  <span className="status-row__state">
                    {component.ok ? 'Operational' : 'Degraded'}
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">
              <span className="dot" />
              Detailed measurements
            </span>
            <h2>What the server observes about itself</h2>
            <p>
              The same indicators as the Features page, re-read the moment you open this
              one.
            </p>
          </div>

          <ul className="metrics">
            {metrics.map((item, index) => (
              <Reveal as="li" key={item.id} delay={index * 80}>
                <div className="card card--hover metric">
                  <strong className="metric__value">
                    {formatMetric(item.value, item.precision)}
                    {item.suffix}
                  </strong>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </Page>
  )
}
