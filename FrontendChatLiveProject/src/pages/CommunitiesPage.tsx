import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Community } from '../types'
import { ApiError, communitiesApi } from '../lib/api'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import '../styles/backgrounds/waves.css'
import '../styles/pages/communities.css'

const numberFormat = new Intl.NumberFormat('en-US')

export default function CommunitiesPage() {
  const [topic, setTopic] = useState<string>('All')
  const [query, setQuery] = useState('')

  const [catalogue, setCatalogue] = useState<readonly Community[]>([])
  const [topics, setTopics] = useState<readonly string[]>(['All'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      communitiesApi.list({}, controller.signal),
      communitiesApi.topics(controller.signal),
    ])
      .then(([directory, categories]) => {
        setCatalogue(directory.data)
        setTopics(categories.data)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(
          cause instanceof ApiError
            ? cause.message
            : 'The community directory is temporarily unavailable.',
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return catalogue.filter((community) => {
      const matchTopic = topic === 'All' || community.topic === topic
      const matchQuery =
        needle.length === 0 ||
        community.name.toLowerCase().includes(needle) ||
        community.description.toLowerCase().includes(needle)
      return matchTopic && matchQuery
    })
  }, [catalogue, topic, query])

  const totalOnline = useMemo(
    () => results.reduce((sum, community) => sum + community.online, 0),
    [results],
  )

  return (
    <Page
      description="Join ChatLive communities from all over the world: languages, technology, cooking, sports, art. Thousands of friends connected around the clock."
      background="waves"
    >
      <PageHero
        eyebrow="Communities"
        title={
          <>
            Rooms open <span className="gradient-text">to the whole world</span>
          </>
        }
        description="Join a community that suits you, or create your own. Every room is moderated, translated and accessible from all your devices."
      >
        <div className="page-hero__actions">
          <Link to="/chat" className="btn btn--primary btn--lg">
            Join a room
            <Icon name="arrow-right" size={18} />
          </Link>
          <Link to="/contact" className="btn btn--ghost btn--lg">
            Create my community
          </Link>
        </div>
      </PageHero>

      <section className="section">
        <div className="container">
          <div className="filters">
            <div className="chat__search filters__search">
              <Icon name="search" size={16} />
              <label className="sr-only" htmlFor="community-search">
                Search for a community
              </label>
              <input
                id="community-search"
                type="search"
                placeholder="Search for a community"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <ul className="filters__topics" role="list">
              {topics.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    className={`chip${topic === item ? ' is-active' : ''}`}
                    onClick={() => setTopic(item)}
                    aria-pressed={topic === item}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="filters__summary" role="status">
            <strong>{results.length}</strong> {results.length === 1 ? 'community' : 'communities'}
            {' - '}
            <strong>{numberFormat.format(totalOnline)}</strong> members online
          </p>

          {loading ? (
            <div className="card empty-state">
              <Icon name="globe" size={26} />
              <h3>Loading the directory</h3>
              <p>Communities and their audience are read from the server.</p>
            </div>
          ) : error ? (
            <div className="card empty-state">
              <Icon name="close" size={26} />
              <h3>Directory unavailable</h3>
              <p>{error}</p>
            </div>
          ) : results.length > 0 ? (
            <ul className="communities">
              {results.map((community, index) => (
                <Reveal as="li" key={community.id} delay={index * 70}>
                  <article
                    className={`card card--hover community${community.featured ? ' community--featured' : ''}`}
                  >
                    <header className="community__head">
                      <span className="community__badge">{community.emoji}</span>
                      <div>
                        <h3>{community.name}</h3>
                        <span className="tag">{community.topic}</span>
                      </div>
                      {community.featured && (
                        <span className="community__star" title="Featured community">
                          <Icon name="star" size={15} />
                        </span>
                      )}
                    </header>

                    <p className="community__desc">{community.description}</p>

                    <ul className="community__langs">
                      {community.languages.map((language) => (
                        <li key={language} className="flag">
                          {language}
                        </li>
                      ))}
                    </ul>

                    <footer className="community__foot">
                      <span className="community__stat">
                        <Icon name="users" size={15} />
                        {numberFormat.format(community.members)} members
                      </span>
                      <span className="community__stat community__stat--online">
                        <span className="presence-dot" />
                        {numberFormat.format(community.online)} online
                      </span>
                    </footer>

                    <Link
                      to={`/chat?community=${community.id}&name=${encodeURIComponent(community.name)}`}
                      className="btn btn--ghost btn--sm btn--block"
                    >
                      Join
                      <Icon name="arrow-right" size={15} />
                    </Link>
                  </article>
                </Reveal>
              ))}
            </ul>
          ) : (
            <div className="card empty-state">
              <Icon name="search" size={26} />
              <h3>No community matches</h3>
              <p>Try another keyword or go back to the “All” category.</p>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setQuery('')
                  setTopic('All')
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </section>
    </Page>
  )
}
