import { useEffect, useState } from 'react'
import type { Community } from '../../types'
import { adminApi, ApiError, communitiesApi } from '../../lib/api'
import { formatCount } from '../../lib/format'
import { Icon } from '../ui/Icon'

interface Draft {
  name: string
  topic: string
  description: string
  languages: string
  emoji: string
  featured: boolean
}

const EMPTY: Draft = {
  name: '',
  topic: '',
  description: '',
  languages: '',
  emoji: '',
  featured: false,
}

const toDraft = (community: Community): Draft => ({
  name: community.name,
  topic: community.topic,
  description: community.description,
  languages: community.languages.join(', '),
  emoji: community.emoji,
  featured: community.featured,
})

const toPayload = (draft: Draft) => ({
  name: draft.name.trim(),
  topic: draft.topic.trim(),
  description: draft.description.trim(),
  languages: draft.languages
    .split(',')
    .map((language) => language.trim())
    .filter(Boolean),
  emoji: draft.emoji.trim().toUpperCase(),
  featured: draft.featured,
})

export function CommunityEditor() {
  const [communities, setCommunities] = useState<readonly Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [busy, setBusy] = useState(false)

  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    communitiesApi
      .list({}, controller.signal)
      .then((response) => {
        setCommunities(response.data)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof ApiError ? cause.message : 'Could not load.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [reload])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = toPayload(draft)

    if (payload.name.length < 2 || payload.description.length < 12) {
      setError('Name and description are required (12 characters minimum).')
      return
    }

    setBusy(true)
    try {
      if (editing === 'new') {
        await adminApi.createCommunity(payload)
      } else if (editing) {
        await adminApi.updateCommunity(editing, payload)
      }
      setEditing(null)
      setReload((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    setBusy(true)
    try {
      await adminApi.deleteCommunity(id)
      setReload((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not delete.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="card empty-state">
        <Icon name="globe" size={24} />
        <h3>Loading the directory</h3>
      </div>
    )
  }

  return (
    <div className="admin-section">
      <header className="admin-section__head">
        <div>
          <h2>Communities</h2>
          <p>
            The directory of the Communities page. The audience shown is counted from the
            rooms attached to each community: it cannot be entered by hand.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            setDraft(EMPTY)
            setEditing('new')
            setError(null)
          }}
        >
          <Icon name="plus" size={15} />
          New community
        </button>
      </header>

      {error && <p className="field__error">{error}</p>}

      {editing && (
        <form className="card admin-create" onSubmit={submit}>
          <h3>{editing === 'new' ? 'New community' : 'Edit community'}</h3>

          <div className="field">
            <label htmlFor="community-name">Name</label>
            <input
              id="community-name"
              type="text"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="community-topic">Category</label>
            <input
              id="community-topic"
              type="text"
              value={draft.topic}
              onChange={(event) => setDraft({ ...draft, topic: event.target.value })}
            />
            <p className="field__hint">
              It feeds the page filters: a new category adds a button there.
            </p>
          </div>

          <div className="field">
            <label htmlFor="community-description">Description</label>
            <textarea
              id="community-description"
              rows={3}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </div>

          <div className="admin-identity__row">
            <div className="field">
              <label htmlFor="community-languages">Languages</label>
              <input
                id="community-languages"
                type="text"
                value={draft.languages}
                onChange={(event) => setDraft({ ...draft, languages: event.target.value })}
              />
              <p className="field__hint">
                Comma-separated names, as they should read on the card: French,
                English, Japanese.
              </p>
            </div>

            <div className="field">
              <label htmlFor="community-emoji">Badge</label>
              <input
                id="community-emoji"
                type="text"
                maxLength={2}
                value={draft.emoji}
                onChange={(event) => setDraft({ ...draft, emoji: event.target.value })}
              />
              <p className="field__hint">Two letters. Empty: derived from the name.</p>
            </div>
          </div>

          <div className="field">
            <label className="checkbox" htmlFor="community-featured">
              <input
                id="community-featured"
                type="checkbox"
                checked={draft.featured}
                onChange={(event) => setDraft({ ...draft, featured: event.target.checked })}
              />
              <span>Featured in the directory</span>
            </label>
          </div>

          <div className="admin-entry__foot">
            <button type="submit" className="btn btn--primary btn--sm" disabled={busy}>
              {busy ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setEditing(null)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <ul className="admin-section__list">
        {communities.map((community) => (
          <li key={community.id}>
            <article className="card admin-community">
              <span className="community__badge">{community.emoji}</span>
              <div className="admin-community__body">
                <strong>{community.name}</strong>
                <small>
                  {community.topic} - {community.languages.join(', ')}
                </small>
                <p>{community.description}</p>
                <p className="admin-community__counts">
                  <Icon name="users" size={14} />
                  {formatCount(community.members)} members · {formatCount(community.online)}{' '}
                  online <em>(measured)</em>
                </p>
              </div>
              <div className="admin-community__actions">
                {community.featured && <span className="tag tag--brand">Featured</span>}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setDraft(toDraft(community))
                    setEditing(community.id)
                    setError(null)
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm admin__danger"
                  onClick={() => void remove(community.id)}
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}
