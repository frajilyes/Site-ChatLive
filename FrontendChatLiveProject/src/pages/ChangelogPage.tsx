import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { useSite } from '../hooks/useSite'
import { plural } from '../lib/format'
import '../styles/backgrounds/waves.css'
import '../styles/pages/changelog.css'

export default function ChangelogPage() {
  const { content } = useSite()
  const { site, milestones } = content

  const entries = useMemo(() => [...milestones].reverse(), [milestones])

  const years = useMemo(() => {
    const seen: string[] = []
    for (const entry of entries) {
      if (!seen.includes(entry.year)) seen.push(entry.year)
    }
    return seen
  }, [entries])

  const [year, setYear] = useState<string | null>(null)
  const shown = year ? entries.filter((entry) => entry.year === year) : entries

  return (
    <Page
      description={`The public milestones of ${site.name}, from the first version to today.`}
      background="waves"
    >
      <PageHero
        eyebrow="Resources"
        title={
          <>
            Release <span className="gradient-text">notes</span>
          </>
        }
        description={`What we have shipped since ${site.founded}, in reverse order: newest first.`}
      >
        <div className="page-hero__actions">
          <Link to="/features" className="btn btn--primary">
            See the features
            <Icon name="arrow-right" size={17} />
          </Link>
          <Link to="/status" className="btn btn--ghost">
            Service status
          </Link>
        </div>
      </PageHero>

      <section className="section">
        <div className="container container--narrow">
          <ul className="filters__topics">
            <li>
              <button
                type="button"
                className={`chip${year === null ? ' is-active' : ''}`}
                aria-pressed={year === null}
                onClick={() => setYear(null)}
              >
                All
              </button>
            </li>
            {years.map((value) => (
              <li key={value}>
                <button
                  type="button"
                  className={`chip${year === value ? ' is-active' : ''}`}
                  aria-pressed={year === value}
                  onClick={() => setYear(year === value ? null : value)}
                >
                  {value}
                </button>
              </li>
            ))}
          </ul>

          <p className="filters__summary" role="status">
            <strong>{shown.length}</strong> {plural(shown.length, 'entry', 'entries')}
            {year ? ` in ${year}` : ' in total'}
          </p>

          <ol className="changelog">
            {shown.map((entry, index) => (
              <Reveal as="li" key={entry.id} delay={index * 70} className="changelog__item">
                <article className="card card--hover changelog__card">
                  <header className="changelog__head">
                    <span className="tag tag--brand">{entry.year}</span>
                    <h2>{entry.title}</h2>
                  </header>
                  <p>{entry.description}</p>
                </article>
              </Reveal>
            ))}
          </ol>

          {shown.length === 0 && (
            <div className="card empty-state">
              <Icon name="search" size={30} />
              <p>No entries for this year.</p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setYear(null)}>
                Show the whole changelog
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="cta cta--soft">
              <div className="cta__content">
                <h2>Get notified of upcoming releases</h2>
                <p>
                  The monthly newsletter sums up what has changed, with no ads. The form is
                  at the bottom of every page.
                </p>
                <div className="cta__actions">
                  <Link to="/contact" className="btn btn--primary btn--lg">
                    Suggest an improvement
                    <Icon name="arrow-right" size={18} />
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
