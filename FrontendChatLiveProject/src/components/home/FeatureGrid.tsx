import { Link, useLocation } from 'react-router-dom'
import type { Feature } from '../../types'
import { Icon } from '../ui/Icon'
import { Reveal } from '../ui/Reveal'

interface FeatureGridProps {
  readonly features: readonly Feature[]
  readonly columns?: 2 | 3
}

export function FeatureGrid({ features, columns = 3 }: FeatureGridProps) {
  const { pathname } = useLocation()

  return (
    <ul className={`features features--${columns}`}>
      {features.map((feature, index) => {
        const linked = feature.to && feature.to !== pathname
        const body = (
          <>
            <span className="feature__icon">
              <Icon name={feature.icon} size={22} />
            </span>
            <span className="tag tag--brand">{feature.tag}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            {linked && (
              <span className="feature__go">
                Learn more
                <Icon name="arrow-right" size={15} />
              </span>
            )}
          </>
        )

        return (
          <Reveal as="li" key={feature.id} delay={index * 90}>
            {linked ? (
              <Link to={feature.to as string} className="card card--hover feature feature--link">
                {body}
              </Link>
            ) : (
              <article className="card card--hover feature">{body}</article>
            )}
          </Reveal>
        )
      })}
    </ul>
  )
}
