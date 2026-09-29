import { useEffect, useMemo, useState } from 'react'
import type { AuthUser, UserRole } from '../../types'
import { ApiError, usersApi } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_DESCRIPTIONS, roleLabel } from '../../lib/roles'
import { Icon } from '../ui/Icon'

const ROLES: readonly UserRole[] = ['user', 'moderator', 'admin']

export function UserRoles() {
  const { user: current } = useAuth()

  const [accounts, setAccounts] = useState<readonly AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    usersApi
      .all(controller.signal)
      .then((response) => {
        setAccounts(response.data)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof ApiError ? cause.message : 'Could not load accounts.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return accounts
    return accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(needle) ||
        account.email.toLowerCase().includes(needle),
    )
  }, [accounts, query])

  const admins = accounts.filter((account) => account.role === 'admin').length

  const change = async (account: AuthUser, role: UserRole) => {
    if (role === account.role) return

    setBusyId(account.id)
    setNotice(null)
    try {
      const response = await usersApi.setRole(account.id, role)
      setNotice(`${account.name} is now ${roleLabel(role).toLowerCase()}.`)
      setError(null)
      setAccounts((list) =>
        list.map((entry) => (entry.id === account.id ? response.user : entry)),
      )
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not change the role.')
      setNotice(null)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="card empty-state">
        <Icon name="users" size={24} />
        <h3>Loading accounts</h3>
      </div>
    )
  }

  return (
    <div className="admin-section">
      <header className="admin-section__head">
        <div>
          <h2>Account roles</h2>
          <p>
            {accounts.length} account{accounts.length === 1 ? '' : 's'}, including {admins}{' '}
            administrator{admins === 1 ? '' : 's'}. A role takes effect on the account's
            next request.
          </p>
        </div>
      </header>

      <ul className="roles-legend">
        {ROLES.map((role) => (
          <li key={role}>
            <strong>{roleLabel(role)}</strong>
            <span>{ROLE_DESCRIPTIONS[role]}</span>
          </li>
        ))}
      </ul>

      {error && <p className="field__error admin__error">{error}</p>}
      {notice && (
        <p className="admin__notice" role="status">
          <Icon name="check" size={15} />
          {notice}
        </p>
      )}

      <div className="chat__search roles__search">
        <Icon name="search" size={16} />
        <label className="sr-only" htmlFor="roles-search">
          Search for an account
        </label>
        <input
          id="roles-search"
          type="search"
          placeholder="Name or email address"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <ul className="roles">
        {results.map((account) => {
          const isSelf = account.id === current?.id
          return (
            <li key={account.id} className="card roles__row">
              <span className="avatar avatar--sm">{account.initials}</span>

              <span className="roles__identity">
                <strong>
                  {account.name}
                  {isSelf && <em> (you)</em>}
                </strong>
                <small>
                  <span className="flag">{account.flag}</span> {account.email}
                </small>
              </span>

              <span className={`roles__badge roles__badge--${account.role}`}>
                {roleLabel(account.role)}
              </span>

              <label className="sr-only" htmlFor={`role-${account.id}`}>
                Role of {account.name}
              </label>
              <select
                id={`role-${account.id}`}
                className="roles__select"
                value={account.role}
                disabled={busyId === account.id}
                onChange={(event) => void change(account, event.target.value as UserRole)}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </li>
          )
        })}

        {results.length === 0 && (
          <li className="card empty-state">
            <Icon name="search" size={24} />
            <p>No account matches “{query}”.</p>
          </li>
        )}
      </ul>
    </div>
  )
}
