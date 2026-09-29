import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { useSite } from '../hooks/useSite'
import { formatCount, plural } from '../lib/format'
import '../styles/backgrounds/grid.css'
import '../styles/pages/about.css'

export default function AboutPage() {
  const { content, values } = useSite()
  const { site, team, milestones } = content

  return (
    <Page
      description={`The ${site.name} project and the values that guide each of its product decisions.`}
      background="grid"
    >
      <PageHero
        eyebrow="About"
        title={
          <>
            Talk without{' '}
            <span className="gradient-text">borders</span>
          </>
        }
        description={`What ${site.name} sets out to do: a fast chat app that tells you where each message comes from, and that sells nothing.`}
      />

      {content.values.length > 0 && (
        <section className="section">
          <div className="container">
            <ul className="values">
              {content.values.map((value, index) => (
                <Reveal as="li" key={value.id} delay={index * 100}>
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

      {milestones.length > 0 && (
        <section className="section">
          <div className="container container--narrow">
            <div className="section-head">
              <span className="eyebrow">
                <span className="dot" />
                Our story
              </span>
              <h2>
                Members in {formatCount(values.countries)}{' '}
                {plural(values.countries, 'country', 'countries')}
              </h2>
              <p>
                Releases, version by version, are listed in the{' '}
                <Link to="/changelog">changelog</Link>.
              </p>
            </div>

            <ol className="timeline">
              {milestones.map((milestone, index) => (
                <Reveal
                  as="li"
                  key={milestone.id}
                  delay={index * 90}
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

      {team.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">
                <span className="dot" />
                The team
              </span>
              <h2>
                {team.length} {plural(team.length, 'person', 'people')}, one conversation
              </h2>
              <p>
                Journalists: the <Link to="/press">press kit</Link> includes this
                information.
              </p>
            </div>

            <ul className="team">
              {team.map((member, index) => (
                <Reveal as="li" key={member.id} delay={index * 80}>
                  <article className="card card--hover member-card">
                    <span className="avatar avatar--lg">{member.initials}</span>
                    <h3>{member.name}</h3>
                    <p className="member-card__role">{member.role}</p>
                    <p className="member-card__city">
                      <Icon name="globe" size={14} />
                      {member.city}
                    </p>
                    <p className="member-card__bio">{member.bio}</p>
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
                <h2>Want to build {site.name} with us?</h2>
                <p>
                  The Careers page explains how we work and how to apply.
                </p>
                <div className="cta__actions">
                  <Link to="/careers" className="btn btn--primary btn--lg">
                    See how to join us
                    <Icon name="arrow-right" size={18} />
                  </Link>
                  <Link to="/contact" className="btn btn--ghost btn--lg">
                    Write to us
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
