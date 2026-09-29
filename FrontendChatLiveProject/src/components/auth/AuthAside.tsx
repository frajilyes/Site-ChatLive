import { Link } from 'react-router-dom'
import { useSite } from '../../hooks/useSite'
import { plural } from '../../lib/format'
import { Icon } from '../ui/Icon'
import { Reveal } from '../ui/Reveal'

export function AuthAside() {
  const { content, showcase } = useSite()
  const online = (showcase?.online ?? []).slice(0, 5)

  return (
    <Reveal className="auth__aside" delay={120}>
      <ul className="auth__benefits">
        {content.authBenefits.map((benefit) => (
          <li key={benefit.id} className="auth__benefit">
            <span className="feature__icon">
              <Icon name={benefit.icon} size={20} />
            </span>
            <div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          </li>
        ))}
      </ul>

      {online.length > 0 && (
        <div className="card auth__online">
          <div className="auth__online-avatars">
            {online.map((user) => (
              <span
                key={user.id}
                className="avatar avatar--sm presence presence--online"
                title={`${user.name} - ${user.country}`}
              >
                {user.initials}
              </span>
            ))}
          </div>
          <p>
            <strong>
              {online.length} {plural(online.length, 'member')}
            </strong>{' '}
            {plural(online.length, 'is', 'are')} online right now.{' '}
            <Link to="/communities">See the communities</Link>
          </p>
        </div>
      )}
    </Reveal>
  )
}
