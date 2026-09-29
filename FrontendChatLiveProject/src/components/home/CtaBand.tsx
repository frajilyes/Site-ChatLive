import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { Reveal } from '../ui/Reveal'

export function CtaBand() {
  return (
    <section className="section">
      <div className="container">
        <Reveal>
          <div className="cta">
            <div className="cta__shine" aria-hidden="true" />
            <div className="cta__content">
              <h2>Your friends are already somewhere on the map.</h2>
              <p>
                Create your room in thirty seconds and meet them live, with every
                message showing the language it was written in.
              </p>
              <div className="cta__actions">
                <Link to="/chat" className="btn btn--light btn--lg">
                  Open the chat
                  <Icon name="arrow-right" size={18} />
                </Link>
                <Link to="/features" className="btn btn--ghost btn--lg cta__ghost">
                  See the features
                </Link>
              </div>
              <ul className="cta__points">
                <li>
                  <Icon name="check" size={15} /> No credit card
                </li>
                <li>
                  <Icon name="check" size={15} /> No ads
                </li>
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
