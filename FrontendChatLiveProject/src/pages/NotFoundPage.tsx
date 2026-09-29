import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { useSite } from '../hooks/useSite'
import '../styles/backgrounds/pulse.css'
import '../styles/pages/notfound.css'

export default function NotFoundPage() {
  const { content } = useSite()

  return (
    <Page
      description="This page does not exist or has been moved. Find the chat, the communities and the other sections of ChatLive."
      background="pulse"
    >
      <section className="section notfound">
        <div className="container notfound__inner">
          <span className="eyebrow">
            <span className="dot" />
            Error 404
          </span>
          <p className="notfound__code">404</p>
          <h1 className="notfound__title">
            This room seems <span className="gradient-text">to be missing</span>
          </h1>
          <p className="notfound__desc">
            The page you are looking for may have been moved or never existed. Here are
            the most visited destinations.
          </p>

          <div className="notfound__actions">
            <Link to="/" className="btn btn--primary btn--lg">
              Back to home
              <Icon name="arrow-right" size={18} />
            </Link>
            <Link to="/chat" className="btn btn--ghost btn--lg">
              Open the chat
            </Link>
          </div>

          <ul className="notfound__links">
            {content.nav.filter((item) => item.path !== '/').map((item) => (
              <li key={item.path}>
                <Link to={item.path} className="card card--hover notfound__link">
                  <span className="feature__icon">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                  <Icon name="arrow-right" size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Page>
  )
}
