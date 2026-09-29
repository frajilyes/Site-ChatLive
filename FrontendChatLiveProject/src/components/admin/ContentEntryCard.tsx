import { useState } from 'react'
import type { ContentEntry } from '../../types'
import { Icon } from '../ui/Icon'
import { FieldInput } from './FieldInput'
import { titleOf, type SectionSpec } from './sections'

interface ContentEntryCardProps {
  readonly spec: SectionSpec
  readonly entry: ContentEntry
  readonly first: boolean
  readonly last: boolean
  readonly onSave: (payload: {
    published: boolean
    data: Record<string, unknown>
  }) => Promise<void>
  readonly onDelete: () => Promise<void>
  readonly onMove: (direction: -1 | 1) => Promise<void>
}

export function ContentEntryCard({
  spec,
  entry,
  first,
  last,
  onSave,
  onDelete,
  onMove,
}: ContentEntryCardProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>(entry.data)
  const [published, setPublished] = useState(entry.published)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    published !== entry.published || JSON.stringify(draft) !== JSON.stringify(entry.data)

  const update = (key: string, value: unknown) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  const save = async () => {
    const missing = spec.fields.filter((field) => {
      if (!field.required) return false
      const value = draft[field.key]
      return typeof value === 'string' ? !value.trim() : value === undefined || value === null
    })

    if (missing.length > 0) {
      setError(`Required: ${missing.map((field) => field.label).join(', ')}.`)
      return
    }

    const cleaned: Record<string, unknown> = { ...draft }
    for (const field of spec.fields) {
      if (field.type === 'lines' && Array.isArray(cleaned[field.key])) {
        cleaned[field.key] = (cleaned[field.key] as string[])
          .map((line) => line.trim())
          .filter(Boolean)
      }
      if (field.type === 'links' && Array.isArray(cleaned[field.key])) {
        cleaned[field.key] = (cleaned[field.key] as { label: string; to: string }[]).filter(
          (link) => link.label.trim() && link.to.trim(),
        )
      }
    }

    setBusy(true)
    try {
      await onSave({ published, data: cleaned })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await onDelete()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete.')
      setBusy(false)
    }
  }

  const move = async (direction: -1 | 1) => {
    setBusy(true)
    try {
      await onMove(direction)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not move.')
      setBusy(false)
    }
  }

  return (
    <article className={`card admin-entry${open ? ' is-open' : ''}`}>
      <header className="admin-entry__head">
        <button
          type="button"
          className="admin-entry__toggle"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <Icon name={open ? 'minus' : 'plus'} size={16} />
          <span className="admin-entry__title">{titleOf(spec, draft)}</span>
          <code className="admin-entry__key">{entry.key}</code>
        </button>

        <div className="admin-entry__actions">
          {!entry.published && <span className="tag">Unpublished</span>}
          {dirty && <span className="tag tag--brand">Modified</span>}

          <button
            type="button"
            className="icon-btn"
            onClick={() => void move(-1)}
            disabled={first || busy}
            aria-label="Move entry up"
            title="Move up"
          >
            <Icon name="arrow-right" size={15} className="admin-entry__up" />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => void move(1)}
            disabled={last || busy}
            aria-label="Move entry down"
            title="Move down"
          >
            <Icon name="arrow-right" size={15} className="admin-entry__down" />
          </button>
        </div>
      </header>

      {open && (
        <div className="admin-entry__body">
          {spec.fields.map((field) => (
            <FieldInput
              key={field.key}
              spec={field}
              id={`${entry.section}-${entry.key}-${field.key}`}
              value={draft[field.key]}
              onChange={(value) => update(field.key, value)}
            />
          ))}

          <div className="field">
            <label className="checkbox" htmlFor={`${entry.key}-published`}>
              <input
                id={`${entry.key}-published`}
                type="checkbox"
                checked={published}
                onChange={(event) => setPublished(event.target.checked)}
              />
              <span>Published on the site</span>
            </label>
          </div>

          {error && <p className="field__error">{error}</p>}

          <div className="admin-entry__foot">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => void save()}
              disabled={busy || !dirty}
            >
              {busy ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm admin__danger"
              onClick={() => void remove()}
              disabled={busy}
            >
              Delete
            </button>
            <span className="admin-entry__stamp">
              Last modified on{' '}
              {new Date(entry.updatedAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      )}
    </article>
  )
}
