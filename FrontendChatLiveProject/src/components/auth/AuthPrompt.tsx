import { Link, useLocation } from 'react-router-dom'
import { useSite } from '../../hooks/useSite'
import { formatCount } from '../../lib/format'
import { Page } from '../layout/Page'
import { Icon } from '../ui/Icon'
import { Reveal } from '../ui/Reveal'
import '../../styles/backgrounds/orbits.css'
import '../../styles/pages/authgate.css'

export function AuthPrompt() {
  const location = useLocation()
  const from = location.pathname
  const { values } = useSite()

  return (
    <Page
      description="Sign in to ChatLive to join your rooms and chat live with your friends, anywhere in the world."
      background="orbits"
    >
      <section className="section auth-gate">
        <div className="container">
          <Reveal className="card auth-gate__card">
            <span className="auth-gate__lock">
              <Icon name="lock" size={26} />
            </span>

            <span className="eyebrow">
              <span className="dot" />
              Sign-in required
            </span>

            <h1 className="auth-gate__title">
              Sign in to <span className="gradient-text">chat with your friends</span>
            </h1>

            <p className="auth-gate__desc">
              Live chat is for members only: that is what makes real-time presence possible
              and keeps every room closed to those who were not invited. Creating an
              account takes less than a minute.
            </p>

            <div className="auth-gate__actions">
              <Link
                to="/login"
                state={{ from }}
                className="btn btn--primary btn--lg"
              >
                <Icon name="log-in" size={18} />
                Sign in
              </Link>
              <Link
                to="/register"
                state={{ from }}
                className="btn btn--ghost btn--lg"
              >
                <Icon name="user-plus" size={18} />
                Create an account
              </Link>
            </div>

            <ul className="auth-gate__facts">
              <li>
                <Link to="/communities">
                  <strong>{formatCount(values.publicRooms)}</strong>
                  <span>public rooms are waiting for you</span>
                </Link>
              </li>
              <li>
                <Link to="/communities">
                  <strong>{formatCount(values.onlineUsers)}</strong>
                  <span>members online</span>
                </Link>
              </li>
              <li>
                <Link to="/features">
                  <strong>{formatCount(values.languages)}</strong>
                  <span>languages spoken</span>
                </Link>
              </li>
            </ul>

            <p className="auth-gate__note">
              <Icon name="shield" size={15} />
              No credit card, no ads:{' '}
              <Link to="/privacy">what we keep</Link>.
            </p>
          </Reveal>
        </div>
      </section>
    </Page>
  )
}
