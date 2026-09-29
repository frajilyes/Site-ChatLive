import type { IconName } from '../../types'
import { Icon } from '../ui/Icon'
import { ICON_NAMES, METRIC_SOURCES, type FieldSpec } from './sections'

interface FieldInputProps {
  readonly spec: FieldSpec
  readonly id: string
  readonly value: unknown
  readonly onChange: (value: unknown) => void
}

export interface LinkValue {
  label: string
  to: string
  external?: boolean
}

const asText = (value: unknown): string =>
  typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value)

const asLines = (value: unknown): string[] => (Array.isArray(value) ? value.map(asText) : [])

const asLinks = (value: unknown): LinkValue[] =>
  Array.isArray(value)
    ? value.map((entry) => {
        const link = (entry ?? {}) as Partial<LinkValue>
        return {
          label: asText(link.label),
          to: asText(link.to),
          external: Boolean(link.external),
        }
      })
    : []

export function FieldInput({ spec, id, value, onChange }: FieldInputProps) {
  if (spec.type === 'boolean') {
    return (
      <div className="field">
        <label className="checkbox" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span>{spec.label}</span>
        </label>
        {spec.hint && <p className="field__hint">{spec.hint}</p>}
      </div>
    )
  }

  return (
    <div className="field">
      <label htmlFor={id}>
        {spec.label}
        {spec.required && <span className="admin__required"> *</span>}
      </label>

      {spec.type === 'textarea' && (
        <textarea
          id={id}
          rows={3}
          value={asText(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {spec.type === 'text' && (
        <input
          id={id}
          type="text"
          value={asText(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {spec.type === 'number' && (
        <input
          id={id}
          type="number"
          min={0}
          value={asText(value)}
          onChange={(event) =>
            onChange(event.target.value === '' ? 0 : Number(event.target.value))
          }
        />
      )}

      {spec.type === 'icon' && (
        <div className="admin__icon-field">
          <select id={id} value={asText(value)} onChange={(event) => onChange(event.target.value)}>
            <option value="">None</option>
            {ICON_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <span className="admin__icon-preview" aria-hidden="true">
            <Icon name={asText(value) as IconName} size={18} />
          </span>
        </div>
      )}

      {spec.type === 'metric' && (
        <select id={id} value={asText(value)} onChange={(event) => onChange(event.target.value)}>
          {METRIC_SOURCES.map((source) => (
            <option key={source.value} value={source.value}>
              {source.label}
            </option>
          ))}
        </select>
      )}

      {spec.type === 'lines' && (
        <textarea
          id={id}
          rows={5}
          value={asLines(value).join('\n')}
          onChange={(event) => onChange(event.target.value.split('\n'))}
        />
      )}

      {spec.type === 'links' && (
        <LinkRows id={id} links={asLinks(value)} onChange={onChange} />
      )}

      {spec.hint && <p className="field__hint">{spec.hint}</p>}
    </div>
  )
}

function LinkRows({
  id,
  links,
  onChange,
}: {
  readonly id: string
  readonly links: readonly LinkValue[]
  readonly onChange: (value: LinkValue[]) => void
}) {
  const update = (index: number, patch: Partial<LinkValue>) => {
    onChange(links.map((link, position) => (position === index ? { ...link, ...patch } : link)))
  }

  return (
    <div className="admin__links" id={id}>
      {links.map((link, index) => (
        <div className="admin__link-row" key={index}>
          <input
            type="text"
            aria-label={`Label of link ${index + 1}`}
            placeholder="Label"
            value={link.label}
            onChange={(event) => update(index, { label: event.target.value })}
          />
          <input
            type="text"
            aria-label={`Destination of link ${index + 1}`}
            placeholder="/path or https://..."
            value={link.to}
            onChange={(event) => update(index, { to: event.target.value })}
          />
          <label className="admin__link-external">
            <input
              type="checkbox"
              checked={Boolean(link.external)}
              onChange={(event) => update(index, { external: event.target.checked })}
            />
            External
          </label>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Remove link ${index + 1}`}
            onClick={() => onChange(links.filter((_, position) => position !== index))}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => onChange([...links, { label: '', to: '' }])}
      >
        <Icon name="plus" size={15} />
        Add a link
      </button>
    </div>
  )
}
