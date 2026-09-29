import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { useSite } from '../hooks/useSite'
import { SITE_NAME, absolute } from '../lib/seo'
import { SITE_ORIGIN } from '../lib/site-url'
import '../styles/backgrounds/rays.css'
import '../styles/pages/pricing.css'

type Billing = 'monthly' | 'yearly'

export default function PricingPage() {
  const { content } = useSite()
  const { plans, faq } = content

  const offers = useMemo(() => {
    if (plans.length === 0) return []

    const url = absolute(SITE_ORIGIN, '/pricing')

    return [
      {
        '@type': 'SoftwareApplication',
        '@id': `${absolute(SITE_ORIGIN, '/')}#application`,
        name: SITE_NAME,
        offers: plans.map((plan) => ({
          '@type': 'Offer',
          name: plan.name,
          description: plan.tagline,
          url,
          price: plan.priceMonthly,
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          priceSpecification: [
            {
              '@type': 'UnitPriceSpecification',
              price: plan.priceMonthly,
              priceCurrency: 'EUR',
              referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
            },
            {
              '@type': 'UnitPriceSpecification',
              price: plan.priceYearly,
              priceCurrency: 'EUR',
              referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'ANN' },
            },
          ],
        })),
      },
    ]
  }, [plans])

  const [billing, setBilling] = useState<Billing>('monthly')
  const [openFaq, setOpenFaq] = useState<string | null>(faq[0]?.id ?? null)

  return (
    <Page
      description="ChatLive plans, as published: what each one includes, monthly or yearly."
      background="rays"
      structuredData={offers}
    >
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            Clear pricing, <span className="gradient-text">no bad surprises</span>
          </>
        }
        description="No ads, no data reselling."
      >
        {plans.length > 0 && (
          <div className="billing" role="group" aria-label="Billing period">
            <button
              type="button"
              className={`billing__btn${billing === 'monthly' ? ' is-active' : ''}`}
              onClick={() => setBilling('monthly')}
              aria-pressed={billing === 'monthly'}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`billing__btn${billing === 'yearly' ? ' is-active' : ''}`}
              onClick={() => setBilling('yearly')}
              aria-pressed={billing === 'yearly'}
            >
              Yearly
            </button>
          </div>
        )}
      </PageHero>

      <section className="section">
        <div className="container">
          <ul className="plans">
            {plans.map((plan, index) => {
              const price = billing === 'monthly' ? plan.priceMonthly : plan.priceYearly
              return (
                <Reveal as="li" key={plan.id} delay={index * 110}>
                  <article
                    className={`card plan${plan.highlighted ? ' plan--featured' : ''}`}
                  >
                    {plan.highlighted && <span className="plan__ribbon">Most popular</span>}

                    <header className="plan__head">
                      <h3>{plan.name}</h3>
                      <p>{plan.tagline}</p>
                    </header>

                    <p className="plan__price">
                      <span className="plan__amount">{price}</span>
                      <span className="plan__currency">EUR</span>
                      <span className="plan__period">
                        {price === 0 ? 'forever' : billing === 'monthly' ? '/ month' : '/ year'}
                      </span>
                    </p>

                    <ul className="plan__features">
                      {plan.features.map((feature) => (
                        <li key={feature}>
                          <span className="checklist__icon">
                            <Icon name="check" size={13} />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={plan.ctaTo}
                      className={`btn btn--block ${plan.highlighted ? 'btn--primary' : 'btn--ghost'}`}
                    >
                      {plan.cta}
                    </Link>
                  </article>
                </Reveal>
              )
            })}
          </ul>

          {plans.length === 0 && (
            <div className="card empty-state">
              <Icon name="tag" size={30} />
              <p>
                No plan is published yet. Using the service currently requires no
                payment.
              </p>
              <Link to="/register" className="btn btn--primary btn--sm">
                Create an account
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container container--narrow">
          <div className="section-head">
            <span className="eyebrow">
              <span className="dot" />
              Frequently asked questions
            </span>
            <h2>Everything you are still wondering about</h2>
            <p>
              A question that is not here? The <Link to="/help">help center</Link>{' '}
              has more, and the{' '}
              <Link to="/contact">contact form</Link> is always open.
            </p>
          </div>

          <ul className="faq">
            {faq.map((item) => {
              const open = openFaq === item.id
              return (
                <li key={item.id} className={`faq__item${open ? ' is-open' : ''}`}>
                  <h3>
                    <button
                      type="button"
                      className="faq__question"
                      onClick={() => setOpenFaq(open ? null : item.id)}
                      aria-expanded={open}
                      aria-controls={`faq-${item.id}`}
                    >
                      <span>{item.question}</span>
                      <Icon name={open ? 'minus' : 'plus'} size={18} />
                    </button>
                  </h3>
                  <div className="faq__answer" id={`faq-${item.id}`} hidden={!open}>
                    <p>{item.answer}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </Page>
  )
}
