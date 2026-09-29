import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Testimonial } from '../../types'
import { useSite } from '../../hooks/useSite'
import { formatCount, plural } from '../../lib/format'
import { Icon } from '../ui/Icon'

function Card({ item }: { readonly item: Testimonial }) {
  return (
    <article className="testimonial card">
      <div className="testimonial__stars" aria-label={`${item.rating} stars out of 5`}>
        {Array.from({ length: item.rating }, (_, index) => (
          <Icon key={index} name="star" size={15} />
        ))}
      </div>
      <p className="testimonial__quote">{item.quote}</p>
      <footer className="testimonial__author">
        <span className="avatar">
          {item.author
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)}
        </span>
        <span>
          <strong>{item.author}</strong>
          <small>
            {item.role} - {item.country} <span className="flag">{item.flag}</span>
          </small>
        </span>
      </footer>
    </article>
  )
}

export function Testimonials() {
  const { content, values } = useSite()
  const testimonials = content.testimonials

  const [paused, setPaused] = useState(false)

  if (testimonials.length === 0) return null

  return (
    <section className="section testimonials-section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot" />
            They talk every day
          </span>
          <h2>Friendships that cross time zones</h2>
          <p>
            {formatCount(values.users)} {plural(values.users, 'member')} from{' '}
            {formatCount(values.countries)} {plural(values.countries, 'country', 'countries')}{' '}
            use {content.site.name} to stay in touch.
          </p>

          <div className="testimonials__actions">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
            >
              <Icon name={paused ? 'arrow-right' : 'minus'} size={15} />
              {paused ? 'Resume scrolling' : 'Stop scrolling'}
            </button>
            <Link to="/communities" className="btn btn--ghost btn--sm">
              Join a community
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        </div>
      </div>

      <div className={`marquee${paused ? ' is-paused' : ''}`}>
        <div className="marquee__track">
          {[0, 1].map((copy) => (
            <div className="marquee__group" key={copy} aria-hidden={copy === 1}>
              {testimonials.map((item) => (
                <Card key={`${copy}-${item.id}`} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
