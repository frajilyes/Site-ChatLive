import { Link } from 'react-router-dom'
import { useSite } from '../../hooks/useSite'
import { formatCount, formatMetric, plural } from '../../lib/format'
import { Icon } from '../ui/Icon'
import { ChatPreview } from './ChatPreview'

export function Hero() {
  const { content, values, showcase } = useSite()

  const avatars = (showcase?.online ?? []).slice(0, 5)
  const places = showcase?.places ?? []
  const rating = values.rating

  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__content">
          <span className="eyebrow hero__eyebrow">
            <span className="dot" />
            Live in {formatCount(values.countries)}{' '}
            {plural(values.countries, 'country', 'countries')}
          </span>

          <h1 className="hero__title">
            Talk to your friends
            <span className="gradient-text"> anywhere in the world</span>, live.
          </h1>

          <p className="hero__lead">{content.site.description}</p>

          <div className="hero__actions">
            <Link to="/chat" className="btn btn--primary btn--lg">
              Open the chat
              <Icon name="arrow-right" size={18} />
            </Link>
            <Link to="/features" className="btn btn--ghost btn--lg">
              <Icon name="sparkles" size={18} />
              See the features
            </Link>
          </div>

          <Link to="/communities" className="hero__proof">
            {avatars.length > 0 && (
              <ul className="avatars">
                {avatars.map((user, index) => (
                  <li
                    key={user.id}
                    className="avatars__item"
                    style={{ zIndex: avatars.length - index }}
                    title={`${user.name} - ${user.country}`}
                  >
                    <span className="avatar avatar--sm">{user.initials}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="hero__proof-text">
              {rating > 0 && (
                <div className="hero__stars" aria-label={`Rated ${rating} out of 5`}>
                  {Array.from({ length: Math.round(rating) }, (_, index) => (
                    <Icon key={index} name="star" size={15} />
                  ))}
                  <strong>{formatMetric(rating, 1)}</strong>
                </div>
              )}
              <p>
                {formatCount(values.onlineUsers)} {plural(values.onlineUsers, 'member')} online
                out of {formatCount(values.users)} registered
              </p>
            </div>
            <Icon name="arrow-right" size={16} className="hero__proof-go" />
          </Link>
        </div>

        <div className="hero__visual">
          <ChatPreview />
        </div>
      </div>

      {places.length > 0 && (
        <div className="hero__marquee" aria-hidden="true">
          <div className="hero__marquee-track">
            {Array.from({ length: 2 }, (_, group) => (
              <div className="hero__marquee-group" key={group}>
                {places.map((place) => (
                  <span key={`${group}-${place}`} className="hero__city">
                    <span className="hero__city-dot" />
                    {place}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
