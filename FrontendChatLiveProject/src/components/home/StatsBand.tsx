import { Link } from 'react-router-dom'
import type { Stat } from '../../types'
import { useCountUp } from '../../hooks/useCountUp'
import { useInView } from '../../hooks/useInView'
import { useSite } from '../../hooks/useSite'
import { formatCount, formatMetric } from '../../lib/format'
import { Icon } from '../ui/Icon'

function format(current: number, stat: Stat): string {
  if (stat.value >= 1_000_000) {
    return `${(current / 1_000_000).toFixed(1)}M`
  }
  if (stat.precision > 0) {
    return formatMetric(current, stat.precision)
  }
  return formatCount(current)
}

function StatItem({ stat, active }: { readonly stat: Stat; readonly active: boolean }) {
  const counter = useCountUp(stat.value, active, (value) => format(value, stat))

  const body = (
    <>
      <span className="stats__value">
        <span ref={counter}>{format(0, stat)}</span>
        <em>{stat.suffix}</em>
      </span>
      <span className="stats__label">{stat.label}</span>
      {stat.to && (
        <span className="stats__go">
          Learn more
          <Icon name="arrow-right" size={14} />
        </span>
      )}
    </>
  )

  return (
    <li className="stats__item">
      {stat.to ? (
        <Link to={stat.to} className="stats__link">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  )
}

export function StatsBand() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 })
  const { stats } = useSite()

  if (stats.length === 0) return null

  return (
    <section className="section stats-section">
      <div className="container">
        <div className="stats" ref={ref}>
          <ul className="stats__list">
            {stats.map((stat) => (
              <StatItem key={stat.id} stat={stat} active={inView} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
