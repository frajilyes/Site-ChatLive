import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { useSite } from '../hooks/useSite'
import '../styles/backgrounds/orbits.css'
import '../styles/pages/careers.css'

export default function CareersPage() {
  const { content } = useSite()
  const { site, offices, values: principles } = content

  const [office, setOffice] = useState<string | null>(null)
  const selected = offices.find((item) => item.id === office) ?? null

  return (
    <Page
      description={`Join ${site.name}: unsolicited applications go through the contact form.`}
      background="orbits"
    >
      <PageHero
        eyebrow="Careers"
        title={
          <>
            Build {site.name} <span className="gradient-text">from home</span>
          </>
        }
        description="No positions are open right now, but an unsolicited application is always read."
      >
        <div className="page-hero__actions">
          <Link to="/contact?subject=General%20question" className="btn btn--primary btn--lg">
            Send an application
            <Icon name="arrow-right" size={18} />
          </Link>
          <Link to="/about" className="btn btn--ghost btn--lg">
            Discover the project
          </Link>
        </div>
      </PageHero>

      {offices.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">
                <span className="dot" />
                Our offices
              </span>
              <h2>Choose where you work from</h2>
              <p>
                Click a city to see the time zone of the team based there. You can also
                apply from a city that is not listed.
              </p>
            </div>

            <ul className="filters__topics careers__cities">
              {offices.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`chip${office === item.id ? ' is-active' : ''}`}
                    aria-pressed={office === item.id}
                    onClick={() => setOffice(office === item.id ? null : item.id)}
                  >
                    <span className="flag">{item.flag}</span>
                    {item.city}
                  </button>
                </li>
              ))}
            </ul>

            <p className="careers__city-note" role="status">
              {selected
                ? `${selected.city} (${selected.country}) — time zone ${selected.timezone}.`
                : 'No city selected.'}
            </p>
          </div>
        </section>
      )}

      {principles.length > 0 && (
        <section className="section">
          <div className="container container--narrow">
            <div className="section-head">
              <span className="eyebrow">
                <span className="dot" />
                Our values at work
              </span>
              <h2>What we will ask of you</h2>
              <p>
                The same principles we show our members: they apply internally too.
              </p>
            </div>

            <ul className="values">
              {principles.map((value, index) => (
                <Reveal as="li" key={value.id} delay={index * 90}>
                  <article className="card card--hover value">
                    <span className="value__num">0{index + 1}</span>
                    <h3>{value.title}</h3>
                    <p>{value.description}</p>
                  </article>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="cta cta--soft">
              <div className="cta__content">
                <h2>Want to contribute?</h2>
                <p>
                  Unsolicited applications go through the contact form.
                  Tell us what you can do and what you missed elsewhere.
                </p>
                <div className="cta__actions">
                  <Link
                    to="/contact?subject=General%20question"
                    className="btn btn--primary btn--lg"
                  >
                    Write to us
                    <Icon name="arrow-right" size={18} />
                  </Link>
                  {site.email && (
                    <a href={`mailto:${site.email}`} className="btn btn--ghost btn--lg">
                      {site.email}
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
