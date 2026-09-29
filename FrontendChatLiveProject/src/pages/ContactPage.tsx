import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type {
  ContactFormErrors,
  ContactFormValues,
  SubmitState,
} from '../types'
import { ApiError, contactApi } from '../lib/api'
import { useSite } from '../hooks/useSite'
import { absolute } from '../lib/seo'
import { SITE_ORIGIN } from '../lib/site-url'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import '../styles/backgrounds/bubbles.css'
import '../styles/pages/contact.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {}
  if (values.name.trim().length < 2) {
    errors.name = 'Please enter your name (2 characters minimum).'
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'This email address does not look valid.'
  }
  if (values.message.trim().length < 12) {
    errors.message = 'Your message is a bit short (12 characters minimum).'
  }
  return errors
}

export default function ContactPage() {
  const { content } = useSite()
  const { site, contactChannels, offices, contactSubjects } = content

  const contactPoints = useMemo(() => {
    if (!site.email && !site.phone) return []

    return [
      {
        '@type': 'ContactPage',
        '@id': `${absolute(SITE_ORIGIN, '/contact')}#contactpage`,
        mainEntity: { '@id': `${absolute(SITE_ORIGIN, '/')}#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${absolute(SITE_ORIGIN, '/')}#organization`,
        ...(site.email ? { email: site.email } : {}),
        ...(site.phone ? { telephone: site.phone } : {}),
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            availableLanguage: 'en',
            url: absolute(SITE_ORIGIN, '/contact'),
            ...(site.email ? { email: site.email } : {}),
            ...(site.phone ? { telephone: site.phone } : {}),
          },
        ],
      },
    ]
  }, [site.email, site.phone])

  const [params] = useSearchParams()
  const asked = params.get('subject')
  const preset = asked && contactSubjects.includes(asked) ? asked : contactSubjects[0] ?? ''

  const empty: ContactFormValues = {
    name: '',
    email: '',
    subject: preset,
    message: '',
  }

  const [values, setValues] = useState<ContactFormValues>(empty)
  const [errors, setErrors] = useState<ContactFormErrors>({})
  const [state, setState] = useState<SubmitState>('idle')
  const [notice, setNotice] = useState<string | null>(null)

  const update = <K extends keyof ContactFormValues>(
    field: K,
    value: ContactFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(null)

    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setState('error')
      return
    }

    setState('sending')
    try {
      const response = await contactApi.send({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        subject: values.subject,
        message: values.message.trim(),
      })

      setNotice(response.message)
      setState('sent')
      setValues(empty)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.field && error.field in empty) {
          setErrors({ [error.field]: error.message } as ContactFormErrors)
        } else {
          setNotice(error.message)
        }
      } else {
        setNotice('Sending unavailable right now.')
      }
      setState('error')
    }
  }

  return (
    <Page
      description="Contact ChatLive: questions, reports and suggestions all go through this form."
      background="bubbles"
      structuredData={contactPoints}
    >
      <PageHero
        eyebrow="Contact"
        title={
          <>
            A question? <span className="gradient-text">Write to us</span>
          </>
        }
        description="Every message is read, and the reply arrives by email."
      />

      <section className="section">
        <div className="container contact">
          <Reveal className="contact__form-col">
            <form className="card contact__form" onSubmit={onSubmit} noValidate>
              <h2 className="contact__form-title">Contact form</h2>

              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={(event) => update('name', event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  placeholder="Alex Johnson"
                />
                {errors.name && (
                  <p className="field__error" id="name-error">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(event) => update('email', event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="field__error" id="email-error">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="field">
                <label htmlFor="subject">Subject</label>
                <select
                  id="subject"
                  value={values.subject}
                  onChange={(event) => update('subject', event.target.value)}
                >
                  {contactSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  rows={6}
                  value={values.message}
                  onChange={(event) => update('message', event.target.value)}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  placeholder="Describe your request in a few lines..."
                />
                {errors.message && (
                  <p className="field__error" id="message-error">
                    {errors.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--lg btn--block"
                disabled={state === 'sending'}
              >
                {state === 'sending' ? 'Sending...' : 'Send the message'}
                {state !== 'sending' && <Icon name="send" size={17} />}
              </button>

              <p
                className={`contact__status contact__status--${state}`}
                role="status"
                aria-live="polite"
              >
                {state === 'sent' && (notice ?? 'Message sent. We will reply by email.')}
                {state === 'error' &&
                  (notice ?? 'Some fields need to be corrected.')}
                {state === 'idle' &&
                  'Your data is only used to reply to you and is never shared.'}
                {state === 'sending' && 'Securely sending your message...'}
              </p>
            </form>
          </Reveal>

          <div className="contact__aside">
            {contactChannels.length > 0 && (
              <Reveal delay={120}>
                <ul className="channels">
                  {contactChannels.map((channel) => (
                    <li key={channel.id} className="card card--hover channel">
                      <span className="feature__icon">
                        <Icon name={channel.icon} size={20} />
                      </span>
                      <div>
                        <h3>{channel.title}</h3>
                        <a href={`mailto:${channel.detail}`} className="channel__link">
                          {channel.detail}
                        </a>
                        <p>{channel.hint}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {offices.length > 0 && (
              <Reveal delay={200}>
                <div className="card offices">
                  <h3>Our offices</h3>
                  <ul>
                    {offices.map((office) => (
                      <li key={office.id}>
                        <span className="flag">{office.flag}</span>
                        <span>
                          <strong>{office.city}</strong>
                          <small>
                            {office.country} - {office.timezone}
                          </small>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {(site.legalNote || site.email || site.phone) && (
                    <p className="offices__note">
                      {site.legalNote}
                      {site.legalNote && <br />}
                      {[site.email, site.phone].filter(Boolean).join(' - ')}
                    </p>
                  )}
                  <Link to="/careers" className="btn btn--ghost btn--sm btn--block">
                    Join us
                    <Icon name="arrow-right" size={15} />
                  </Link>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>
    </Page>
  )
}
