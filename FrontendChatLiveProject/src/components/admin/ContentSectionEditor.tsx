import { useMemo, useState } from 'react'
import type { ContentEntry } from '../../types'
import { adminApi, ApiError } from '../../lib/api'
import { Icon } from '../ui/Icon'
import { ContentEntryCard } from './ContentEntryCard'
import { FieldInput } from './FieldInput'
import type { SectionSpec } from './sections'

interface ContentSectionEditorProps {
  readonly spec: SectionSpec
  readonly entries: readonly ContentEntry[]
  readonly onChanged: () => Promise<void>
}

function suggestKey(spec: SectionSpec, entries: readonly ContentEntry[]): string {
  const base = spec.section.replace(/[^a-z]/gi, '').toLowerCase().slice(0, 8)
  let index = entries.length + 1
  const taken = new Set(entries.map((entry) => entry.key))
  while (taken.has(`${base}-${index}`)) index += 1
  return `${base}-${index}`
}

export function ContentSectionEditor({ spec, entries, onChanged }: ContentSectionEditorProps) {
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const ordered = useMemo(
    () => [...entries].sort((left, right) => left.order - right.order),
    [entries],
  )

  const openCreate = () => {
    setKey(suggestKey(spec, entries))
    setDraft({})
    setError(null)
    setCreating(true)
  }

  const create = async () => {
    const trimmed = key.trim()
    if (!trimmed) {
      setError('Give the entry a stable key (it will not change again).')
      return
    }

    const missing = spec.fields.filter((field) => {
      if (!field.required) return false
      const value = draft[field.key]
      return typeof value === 'string' ? !value.trim() : value === undefined || value === null
    })

    if (missing.length > 0) {
      setError(`Required: ${missing.map((field) => field.label).join(', ')}.`)
      return
    }

    setBusy(true)
    try {
      await adminApi.createContent(spec.section, { key: trimmed, data: draft })
      setCreating(false)
      await onChanged()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not create.')
    } finally {
      setBusy(false)
    }
  }

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= ordered.length) return

    const keys = ordered.map((entry) => entry.key)
    ;[keys[index], keys[target]] = [keys[target], keys[index]]

    await adminApi.reorderContent(spec.section, keys)
    await onChanged()
  }

  return (
    <div className="admin-section">
      <header className="admin-section__head">
        <div>
          <h2>{spec.label}</h2>
          <p>{spec.description}</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={openCreate}>
          <Icon name="plus" size={15} />
          New entry
        </button>
      </header>

      {creating && (
        <div className="card admin-create">
          <h3>New entry</h3>

          <div className="field">
            <label htmlFor={`${spec.section}-new-key`}>
              Key<span className="admin__required"> *</span>
            </label>
            <input
              id={`${spec.section}-new-key`}
              type="text"
              value={key}
              onChange={(event) => setKey(event.target.value)}
            />
            <p className="field__hint">
              Stable identifier, never displayed: the code uses it as a reference and it
              must not change afterwards.
            </p>
          </div>

          {spec.fields.map((field) => (
            <FieldInput
              key={field.key}
              spec={field}
              id={`${spec.section}-new-${field.key}`}
              value={draft[field.key]}
              onChange={(value) => {
                setDraft((current) => ({ ...current, [field.key]: value }))
                setError(null)
              }}
            />
          ))}

          {error && <p className="field__error">{error}</p>}

          <div className="admin-entry__foot">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => void create()}
              disabled={busy}
            >
              {busy ? 'Creating...' : 'Create the entry'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setCreating(false)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {ordered.length === 0 ? (
        <div className="card empty-state">
          <Icon name="sparkles" size={24} />
          <h3>Empty section</h3>
          <p>Nothing is shown on the site for this section.</p>
        </div>
      ) : (
        <ul className="admin-section__list">
          {ordered.map((entry, index) => (
            <li key={`${entry.id}-${entry.updatedAt}`}>
              <ContentEntryCard
                spec={spec}
                entry={entry}
                first={index === 0}
                last={index === ordered.length - 1}
                onSave={async (payload) => {
                  await adminApi.updateContent(spec.section, entry.key, payload)
                  await onChanged()
                }}
                onDelete={async () => {
                  await adminApi.deleteContent(spec.section, entry.key)
                  await onChanged()
                }}
                onMove={(direction) => move(index, direction)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
