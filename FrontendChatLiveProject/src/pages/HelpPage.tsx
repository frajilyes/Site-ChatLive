import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { useSite } from '../hooks/useSite'
import { absolute } from '../lib/seo'
import { SITE_ORIGIN } from '../lib/site-url'
import { plural } from '../lib/format'
import '../styles/backgrounds/bubbles.css'
import '../styles/pages/help.css'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export default function HelpPage() {
  const { content } = useSite()
  const { faq, contactChannels, site } = content

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const questions = useMemo(() => {
    if (faq.length === 0) return []

    return [
      {
        '@type': 'FAQPage',
        '@id': `${absolute(SITE_ORIGIN, '/help')}#faq`,
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ]
  }, [faq])

  const results = useMemo(() => {
    const needle = normalize(query.trim())
    if (!needle) return faq
    return faq.filter(
      (item) =>
        normalize(item.question).includes(needle) ||
        normalize(item.answer).includes(needle),
    )
  }, [faq, query])

  const shortcuts = [
    { to: '/features', icon: 'sparkles', title: 'Getting started', text: 'What the platform can do, feature by feature.' },
    { to: '/status', icon: 'bolt', title: 'A connection problem?', text: 'The state of the services, measured live by the server.' },
    { to: '/pricing', icon: 'tag', title: 'Plans and billing', text: 'What each plan includes, monthly or yearly.' },
    { to: '/security', icon: 'shield', title: 'Security and data', text: 'The measures in place and how to report vulnerabilities.' },
  ] as const

  return (
    <Page
      description={`Answers to frequently asked questions about ${site.name}, shortcuts to useful pages and ways to reach support.`}
      background="bubbles"
      structuredData={questions}
    >
      <PageHero
        eyebrow="Resources"
        title={
          <>
            How can we <span className="gradient-text">help you</span>?
          </>
        }
        description="Search the frequently asked questions; if the answer is not there, the contact form passes your question on to the team."
      >
        <div className="page-hero__actions help__search-wrap">
          <label className="sr-only" htmlFor="help-search">
            Search the help
          </label>
          <div className="help__search">
            <Icon name="search" size={18} />
            <input
              id="help-search"
              type="search"
              placeholder="Password, room, billing..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                type="button"
                className="icon-btn"
                aria-label="Clear search"
                onClick={() => setQuery('')}
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        </div>
      </PageHero>

      <section className="section">
        <div className="container">
          <ul className="features features--2">
            {shortcuts.map((shortcut, index) => (
              <Reveal as="li" key={shortcut.to} delay={index * 70}>
                <Link to={shortcut.to} className="card card--hover feature help__shortcut">
                  <span className="feature__icon">
                    <Icon name={shortcut.icon} size={20} />
                  </span>
                  <h3>{shortcut.title}</h3>
                  <p>{shortcut.text}</p>
                  <span className="help__shortcut-go">
                    Open
                    <Icon name="arrow-right" size={15} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container container--narrow">
          <div className="section-head">
            <span className="eyebrow">
              <span className="dot" />
              Frequently asked questions
            </span>
            <h2>
              {results.length} {plural(results.length, 'answer')}
              {query ? ' for this search' : ' in total'}
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="card empty-state">
              <Icon name="search" size={30} />
              <p>No answer matches “{query}”.</p>
              <Link to="/contact" className="btn btn--primary btn--sm">
                Ask the team
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
          ) : (
            <ul className="faq">
              {results.map((item) => {
                const isOpen = open === item.id
                return (
                  <li key={item.id} className={`faq__item${isOpen ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="faq__question"
                      onClick={() => setOpen(isOpen ? null : item.id)}
                      aria-expanded={isOpen}
                      aria-controls={`help-${item.id}`}
                    >
                      {item.question}
                      <Icon name={isOpen ? 'minus' : 'plus'} size={18} />
                    </button>
                    <div className="faq__answer" id={`help-${item.id}`} hidden={!isOpen}>
                      <p>{item.answer}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {contactChannels.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">
                <span className="dot" />
                Contact us
              </span>
              <h2>When the answer is not written down</h2>
            </div>

            <ul className="channels">
              {contactChannels.map((channel, index) => (
                <Reveal as="li" key={channel.id} delay={index * 80}>
                  <article className="card card--hover channel">
                    <span className="feature__icon">
                      <Icon name={channel.icon} size={20} />
                    </span>
                    <div>
                      <h3>{channel.title}</h3>
                      <a href={`mailto:${channel.detail}`} className="channel__link">
                        {channel.detail}
                      </a>
                      <p>{channel.hint}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
    </Page>
  )
}
