import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRoomDirectory } from '../../hooks/useRoomDirectory'
import { Icon } from '../ui/Icon'

export interface RoomDirectoryProps {
  readonly community?: { readonly id: string; readonly name: string } | null
  readonly onJoin: (roomId: string) => Promise<boolean>
  readonly onCreate: (payload: {
    name: string
    topic: string
    emoji?: string
  }) => Promise<boolean>
  readonly empty: boolean
}

type Mode = 'join' | 'create'

export function RoomDirectory({
  onJoin,
  onCreate,
  empty,
  community = null,
}: RoomDirectoryProps) {
  const [open, setOpen] = useState(empty || community !== null)
  const [mode, setMode] = useState<Mode>('join')

  const directory = useRoomDirectory(open && mode === 'join', community?.id ?? '')

  const [pendingId, setPendingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: '', topic: '' })
  const [creating, setCreating] = useState(false)

  const join = useCallback(
    async (roomId: string) => {
      setPendingId(roomId)
      const joined = await onJoin(roomId)
      setPendingId(null)
      if (joined) directory.refresh()
    },
    [onJoin, directory],
  )

  const create = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const name = draft.name.trim()
      const topic = draft.topic.trim()
      if (name.length < 2 || topic.length < 2) return

      setCreating(true)
      const created = await onCreate({ name, topic })
      setCreating(false)

      if (created) {
        setDraft({ name: '', topic: '' })
        setMode('join')
        directory.refresh()
      }
    },
    [draft, onCreate, directory],
  )

  return (
    <div className="room-directory">
      <button
        type="button"
        className="btn btn--ghost btn--sm btn--block"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <Icon name={open ? 'minus' : 'plus'} size={15} />
        {open ? 'Close' : 'Join or create a room'}
      </button>

      {community && open && (
        <p className="room-directory__scope">
          <Icon name="globe" size={14} />
          Rooms in <strong>{community.name}</strong>
          <Link to="/chat">See all</Link>
        </p>
      )}

      {open && (
        <div className="room-directory__panel">
          <div className="room-directory__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={`chip${mode === 'join' ? ' is-active' : ''}`}
              aria-selected={mode === 'join'}
              onClick={() => setMode('join')}
            >
              Join
            </button>
            <button
              type="button"
              role="tab"
              className={`chip${mode === 'create' ? ' is-active' : ''}`}
              aria-selected={mode === 'create'}
              onClick={() => setMode('create')}
            >
              Create
            </button>
          </div>

          {mode === 'join' ? (
            <>
              <div className="chat__search">
                <Icon name="search" size={16} />
                <label className="sr-only" htmlFor="directory-search">
                  Search for a room to join
                </label>
                <input
                  id="directory-search"
                  type="search"
                  placeholder="Search public rooms"
                  value={directory.search}
                  onChange={(event) => directory.setSearch(event.target.value)}
                />
              </div>

              {directory.error && (
                <p className="chat__empty" role="alert">
                  {directory.error}
                </p>
              )}

              <ul className="room-directory__list">
                {directory.results.map((room) => (
                  <li key={room.id} className="room room--static">
                    <span className="room__badge">{room.emoji}</span>
                    <span className="room__text">
                      <strong>{room.name}</strong>
                      <small>{room.topic}</small>
                    </span>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => void join(room.id)}
                      disabled={pendingId !== null}
                    >
                      {pendingId === room.id ? '...' : 'Join'}
                    </button>
                  </li>
                ))}

                {directory.status === 'loading' && (
                  <li className="chat__empty">Searching...</li>
                )}

                {directory.status === 'ready' && directory.results.length === 0 && (
                  <li className="chat__empty">
                    {directory.search.trim()
                      ? 'No public room matches.'
                      : community
                        ? `No rooms to join in ${community.name} yet.`
                        : 'You have joined every public room. Create your own!'}
                  </li>
                )}
              </ul>
            </>
          ) : (
            <form className="room-directory__form" onSubmit={create}>
              <div className="field">
                <label htmlFor="room-name">Room name</label>
                <input
                  id="room-name"
                  type="text"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Morning coffee"
                  minLength={2}
                  maxLength={60}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="room-topic">Topic</label>
                <input
                  id="room-topic"
                  type="text"
                  value={draft.topic}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, topic: event.target.value }))
                  }
                  placeholder="What are we talking about here?"
                  minLength={2}
                  maxLength={140}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--sm btn--block"
                disabled={creating}
              >
                <Icon name="plus" size={15} />
                {creating ? 'Creating...' : 'Create the room'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
