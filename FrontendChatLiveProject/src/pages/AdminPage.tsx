import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ContentEntry, ContentSection, UserRole } from '../types'
import { adminApi, ApiError } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useSite } from '../hooks/useSite'
import { canAccess, roleLabel } from '../lib/roles'
import { CommunityEditor } from '../components/admin/CommunityEditor'
import { ContentSectionEditor } from '../components/admin/ContentSectionEditor'
import { SECTIONS, specOf } from '../components/admin/sections'
import { SiteIdentityForm } from '../components/admin/SiteIdentityForm'
import { TestimonialQueue } from '../components/admin/TestimonialQueue'
import { UserRoles } from '../components/admin/UserRoles'
import '../styles/admin.css'
import { Page } from '../components/layout/Page'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import '../styles/backgrounds/grid.css'
import '../styles/pages/admin.css'

type Tab = 'identity' | 'content' | 'testimonials' | 'communities' | 'accounts'

const TABS: readonly {
  readonly id: Tab
  readonly label: string
  readonly minimum: UserRole
}[] = [
  { id: 'testimonials', label: 'Testimonials', minimum: 'moderator' },
  { id: 'communities', label: 'Communities', minimum: 'moderator' },
  { id: 'identity', label: 'Identity', minimum: 'admin' },
  { id: 'content', label: 'Page content', minimum: 'admin' },
  { id: 'accounts', label: 'Accounts and roles', minimum: 'admin' },
]

export default function AdminPage() {
  const { content, refresh } = useSite()
  const { user } = useAuth()

  const tabs = TABS.filter((entry) => canAccess(user, entry.minimum))
  const isAdmin = canAccess(user, 'admin')

  const [tab, setTab] = useState<Tab>(tabs[0]?.id ?? 'testimonials')
  const [section, setSection] = useState<ContentSection>(SECTIONS[0].section)
  const [entries, setEntries] = useState<readonly ContentEntry[]>([])
  const [loading, setLoading] = useState(isAdmin)
  const [error, setError] = useState<string | null>(null)

  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!isAdmin) return

    const controller = new AbortController()

    adminApi
      .contentEntries(controller.signal)
      .then((response) => {
        setEntries(response.data)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof ApiError ? cause.message : 'Could not read the content.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [isAdmin, reload])

  const onChanged = useCallback(async () => {
    setReload((value) => value + 1)
    refresh()
  }, [refresh])

  const counts = useMemo(() => {
    const map = new Map<ContentSection, number>()
    for (const entry of entries) {
      map.set(entry.section, (map.get(entry.section) ?? 0) + 1)
    }
    return map
  }, [entries])

  const sectionEntries = useMemo(
    () => entries.filter((entry) => entry.section === section),
    [entries, section],
  )

  return (
    <Page
      description="Edit the site content: identity, navigation, plans, team, testimonials and communities."
      background="grid"
    >
      <PageHero
        eyebrow="Admin"
        title={
          <>
            The site content, <span className="gradient-text">editable here</span>
          </>
        }
        description="Texts, plans, team, communities: everything the pages show is read from the database. Figures cannot be edited — they are measured."
      >
        {user && (
          <p className="admin__role" role="status">
            <Icon name="shield" size={15} />
            You are signed in as <strong>{roleLabel(user.role).toLowerCase()}</strong>:{' '}
            {isAdmin
              ? 'everything is open to you, account roles included.'
              : 'testimonials and communities. The site identity, its content and roles are reserved for administrators.'}
          </p>
        )}
      </PageHero>

      <section className="section">
        <div className="container admin">
          <nav className="admin__tabs" aria-label="Admin sections">
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`chip${tab === entry.id ? ' is-active' : ''}`}
                onClick={() => setTab(entry.id)}
                aria-pressed={tab === entry.id}
              >
                {entry.label}
              </button>
            ))}
          </nav>

          {error && <p className="field__error admin__error">{error}</p>}

          {tab === 'identity' && (
            <SiteIdentityForm
              site={content.site}
              onChanged={async () => {
                refresh()
              }}
            />
          )}

          {tab === 'content' &&
            (loading ? (
              <div className="card empty-state">
                <Icon name="sparkles" size={24} />
                <h3>Loading content</h3>
              </div>
            ) : (
              <div className="admin__split">
                <nav className="admin__rubrics" aria-label="Content sections">
                  <ul>
                    {SECTIONS.map((entry) => (
                      <li key={entry.section}>
                        <button
                          type="button"
                          className={`admin__rubric${section === entry.section ? ' is-active' : ''}`}
                          onClick={() => setSection(entry.section)}
                          aria-current={section === entry.section}
                        >
                          <span>{entry.label}</span>
                          <small>{counts.get(entry.section) ?? 0}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>

                <ContentSectionEditor
                  spec={specOf(section)}
                  entries={sectionEntries}
                  onChanged={onChanged}
                />
              </div>
            ))}

          {tab === 'testimonials' && (
            <TestimonialQueue
              onChanged={async () => {
                refresh()
              }}
            />
          )}

          {tab === 'communities' && <CommunityEditor />}

          {tab === 'accounts' && <UserRoles />}
        </div>
      </section>
    </Page>
  )
}
