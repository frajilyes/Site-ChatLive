import { useState } from 'react'
import type { SiteIdentity } from '../../types'
import { adminApi, ApiError } from '../../lib/api'

interface SiteIdentityFormProps {
  readonly site: SiteIdentity
  readonly onChanged: () => Promise<void>
}

export function SiteIdentityForm({ site, onChanged }: SiteIdentityFormProps) {
  const [draft, setDraft] = useState<SiteIdentity>(site)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const dirty = JSON.stringify(draft) !== JSON.stringify(site)

  const update = <K extends keyof SiteIdentity>(field: K, value: SiteIdentity[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setNotice(null)
    setError(null)
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!draft.name.trim()) {
      setError('The site must have a name.')
      return
    }

    setBusy(true)
    try {
      await adminApi.updateSite(draft)
      await onChanged()
      setNotice('Identity saved. The site already shows it.')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card admin-identity" onSubmit={submit}>
      <h2>Site identity</h2>
      <p className="admin-identity__lead">
        The name appears in the navigation bar, the browser tab and the footer. The
        description is used as the pitch on the home page and as the meta description.
      </p>

      <div className="field">
        <label htmlFor="site-name">Name</label>
        <input
          id="site-name"
          type="text"
          value={draft.name}
          onChange={(event) => update('name', event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="site-tagline">Tagline</label>
        <input
          id="site-tagline"
          type="text"
          value={draft.tagline}
          onChange={(event) => update('tagline', event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="site-description">Description</label>
        <textarea
          id="site-description"
          rows={4}
          value={draft.description}
          onChange={(event) => update('description', event.target.value)}
        />
      </div>

      <div className="admin-identity__row">
        <div className="field">
          <label htmlFor="site-email">Email address</label>
          <input
            id="site-email"
            type="email"
            value={draft.email}
            onChange={(event) => update('email', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="site-phone">Phone</label>
          <input
            id="site-phone"
            type="text"
            value={draft.phone}
            onChange={(event) => update('phone', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="site-founded">Year founded</label>
          <input
            id="site-founded"
            type="number"
            value={draft.founded}
            onChange={(event) => update('founded', Number(event.target.value))}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="site-legal">Note below the offices</label>
        <input
          id="site-legal"
          type="text"
          value={draft.legalNote}
          onChange={(event) => update('legalNote', event.target.value)}
        />
      </div>

      {error && <p className="field__error">{error}</p>}
      {notice && <p className="admin__notice">{notice}</p>}

      <button type="submit" className="btn btn--primary btn--sm" disabled={busy || !dirty}>
        {busy ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
