import { useEffect, useState } from 'react'
import type { AdminTestimonial, TestimonialStatus } from '../../types'
import { adminApi, ApiError } from '../../lib/api'
import { Icon } from '../ui/Icon'

const STATUS_LABEL: Record<TestimonialStatus, string> = {
  pending: 'Pending',
  approved: 'Published',
  rejected: 'Rejected',
}

export function TestimonialQueue({ onChanged }: { readonly onChanged: () => Promise<void> }) {
  const [entries, setEntries] = useState<readonly AdminTestimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    adminApi
      .testimonials(controller.signal)
      .then((response) => {
        setEntries(response.data)
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

  const setStatus = async (id: string, status: TestimonialStatus) => {
    setBusyId(id)
    try {
      await adminApi.setTestimonialStatus(id, status)
      setReload((value) => value + 1)
      await onChanged()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not update.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: string) => {
    setBusyId(id)
    try {
      await adminApi.deleteTestimonial(id)
      setReload((value) => value + 1)
      await onChanged()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not delete.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="card empty-state">
        <Icon name="star" size={24} />
        <h3>Loading testimonials</h3>
      </div>
    )
  }

  return (
    <div className="admin-section">
      <header className="admin-section__head">
        <div>
          <h2>Testimonials</h2>
          <p>
            Written by members from their account. Only published testimonials appear
            on the home page and count toward the average rating.
          </p>
        </div>
      </header>

      {error && <p className="field__error">{error}</p>}

      {entries.length === 0 ? (
        <div className="card empty-state">
          <Icon name="star" size={24} />
          <h3>No testimonials</h3>
          <p>The home page banner stays hidden until something is published.</p>
        </div>
      ) : (
        <ul className="admin-section__list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <article className="card admin-testimonial">
                <header className="admin-testimonial__head">
                  <span className="avatar">{entry.author?.initials ?? '??'}</span>
                  <div>
                    <strong>{entry.author?.name ?? 'Deleted account'}</strong>
                    <small>
                      {entry.role}
                      {entry.author && ` - ${entry.author.country}`}
                      {entry.author && <span className="flag"> {entry.author.flag}</span>}
                    </small>
                  </div>
                  <span className={`tag admin-status admin-status--${entry.status}`}>
                    {STATUS_LABEL[entry.status]}
                  </span>
                </header>

                <p className="admin-testimonial__quote">{entry.quote}</p>

                <footer className="admin-testimonial__foot">
                  <span className="admin-testimonial__stars" aria-label={`${entry.rating} out of 5`}>
                    {Array.from({ length: entry.rating }, (_, index) => (
                      <Icon key={index} name="star" size={13} />
                    ))}
                  </span>

                  {entry.status !== 'approved' && (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => void setStatus(entry.id, 'approved')}
                      disabled={busyId === entry.id}
                    >
                      Publish
                    </button>
                  )}
                  {entry.status !== 'rejected' && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => void setStatus(entry.id, 'rejected')}
                      disabled={busyId === entry.id}
                    >
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm admin__danger"
                    onClick={() => void remove(entry.id)}
                    disabled={busyId === entry.id}
                  >
                    Delete
                  </button>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
