import { Link } from 'react-router-dom'
import { useSite } from '../../hooks/useSite'
import { Icon } from '../ui/Icon'
import { Reveal } from '../ui/Reveal'

export function Steps() {
  const { content } = useSite()

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot" />
            Get started
          </span>
          <h2>Three steps, and you're already chatting</h2>
          <p>
            No installation required, no phone number asked. Your first message goes out
            in under a minute.
          </p>
        </div>

        <ol className="steps">
          {content.steps.map((step, index) => (
            <Reveal as="li" key={step.id} delay={index * 120} className="steps__item">
              <span className="steps__index">{step.index}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {step.to && (
                <Link to={step.to} className="steps__go">
                  {step.cta ?? 'Go'}
                  <Icon name="arrow-right" size={15} />
                </Link>
              )}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
