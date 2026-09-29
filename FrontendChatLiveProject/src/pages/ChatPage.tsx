import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { ChatMessage, ChatUser, MemberRole } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { useSite } from '../hooks/useSite'
import { Page } from '../components/layout/Page'
import {
  canGrantRoomRoles,
  canModerateRoom,
  memberRoleLabel,
} from '../lib/roles'
import { RoomDirectory } from '../components/chat/RoomDirectory'
import { Icon } from '../components/ui/Icon'
import '../styles/backgrounds/orbits.css'
import '../styles/pages/chat.css'

const PRESENCE_LABEL: Record<ChatUser['presence'], string> = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
}

function minutesOf(message: ChatMessage, now: number): number {
  if (message.createdAt) {
    const stamp = Date.parse(message.createdAt)
    if (!Number.isNaN(stamp)) return Math.max(0, Math.round((now - stamp) / 60000))
  }
  return message.minutesAgo
}

function translationOf(
  message: ChatMessage,
  author: ChatUser | undefined,
  viewerLanguage: string | undefined,
): string | undefined {
  if (message.translatedFrom) return message.translatedFrom
  if (!author || !viewerLanguage) return undefined
  return author.language === viewerLanguage ? undefined : author.language
}

function formatDelay(minutes: number): string {
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${Math.round(minutes)} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

const TYPING_IDLE = 1200

export default function ChatPage() {
  const { user, logout } = useAuth()
  const { content, status } = useSite()
  const chat = useChat(user?.id)

  const canModerate = canModerateRoom(user, chat.members)
  const canGrant = canGrantRoomRoles(user, chat.members)
  const [busyMember, setBusyMember] = useState<string | null>(null)

  const changeRole = async (userId: string, role: MemberRole) => {
    setBusyMember(userId)
    await chat.setMemberRole(userId, role)
    setBusyMember(null)
  }

  const excludeMember = async (userId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this room?`)) return
    setBusyMember(userId)
    await chat.removeMember(userId)
    setBusyMember(null)
  }

  const [params] = useSearchParams()
  const communityId = params.get('community')
  const community = communityId
    ? { id: communityId, name: params.get('name') ?? 'this community' }
    : null

  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [showLanguage, setShowLanguage] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const threadRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number | null>(null)
  const typingActive = useRef(false)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(id)
  }, [])

  const rooms = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return chat.rooms
    return chat.rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(needle) ||
        room.topic.toLowerCase().includes(needle),
    )
  }, [chat.rooms, query])

  const usersById = useMemo(() => {
    const index = new Map<string, ChatUser>(chat.members.map((member) => [member.id, member]))

    if (user && !index.has(user.id)) {
      index.set(user.id, {
        id: user.id,
        name: user.name,
        initials: user.initials,
        country: user.country,
        flag: user.flag,
        presence: 'online',
        language: user.language,
      })
    }

    return index
  }, [chat.members, user])

  const thread = useMemo(
    () =>
      chat.messages
        .slice()
        .sort((a, b) => Date.parse(a.createdAt ?? '') - Date.parse(b.createdAt ?? '')),
    [chat.messages],
  )

  const onlineCount = useMemo(
    () => chat.members.filter((member) => member.presence === 'online').length,
    [chat.members],
  )

  useEffect(() => {
    const node = threadRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [thread.length, chat.typingUsers.length])

  const handleDraft = useCallback(
    (value: string) => {
      setDraft(value)

      if (typingTimer.current !== null) window.clearTimeout(typingTimer.current)

      if (value.trim().length === 0) {
        if (typingActive.current) {
          typingActive.current = false
          chat.notifyTyping(false)
        }
        return
      }

      if (!typingActive.current) {
        typingActive.current = true
        chat.notifyTyping(true)
      }

      typingTimer.current = window.setTimeout(() => {
        typingActive.current = false
        chat.notifyTyping(false)
      }, TYPING_IDLE)
    },
    [chat],
  )

  const send = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (typingTimer.current !== null) window.clearTimeout(typingTimer.current)
      if (typingActive.current) {
        typingActive.current = false
        chat.notifyTyping(false)
      }

      const sent = await chat.sendMessage(draft)
      if (sent) setDraft('')
    },
    [chat, draft],
  )

  const activeRoom = chat.activeRoom
  const typingUser = chat.typingUsers[0] ?? null

  return (
    <Page
      description="Your real-time rooms: instant messages, the original language of each message and presence indicators, between friends from all over the world."
      background="orbits"
    >
      <div className="container chat-wrap">
        <header className="chat-head">
          <div>
            <span className="eyebrow">
              <span className="dot" />
              {chat.connected ? 'Connected in real time' : 'Connecting to the server...'}
            </span>
            <h1 className="chat-head__title">Live chat</h1>
            <p className="chat-head__desc">
              Pick a room and write: your messages go to the
              {' '}
              {content.site.name} server and reach your friends instantly, along with their
              original language.
            </p>
          </div>

          <div className="chat-head__side">
            {user && (
              <div className="chat-account">
                <span className="avatar avatar--sm presence presence--online">
                  {user.initials}
                </span>
                <span className="chat-account__text">
                  <strong>{user.name}</strong>
                  <small>
                    <span className="flag">{user.flag}</span> connected
                  </small>
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={logout}
                  title="Close your session on this device"
                >
                  <Icon name="log-out" size={16} />
                  Sign out
                </button>
              </div>
            )}

            <button
              type="button"
              className={`toggle${showLanguage ? ' is-on' : ''}`}
              onClick={() => setShowLanguage((value) => !value)}
              aria-pressed={showLanguage}
            >
              <Icon name="translate" size={16} />
              {showLanguage ? 'Original language shown' : 'Show original language'}
            </button>
          </div>
        </header>

        {chat.error && (
          <p className="auth__notice" role="alert">
            <Icon name="shield" size={15} />
            {chat.error}
          </p>
        )}

        <div className="chat">
          <aside className="chat__rooms" aria-label="Room list">
            <div className="chat__search">
              <Icon name="search" size={16} />
              <label className="sr-only" htmlFor="chat-search">
                Search for a room
              </label>
              <input
                id="chat-search"
                type="search"
                placeholder="Search for a room"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <ul className="chat__room-list">
              {rooms.map((room) => (
                <li key={room.id}>
                  <button
                    type="button"
                    className={`room${room.id === activeRoom?.id ? ' is-active' : ''}`}
                    onClick={() => chat.selectRoom(room.id)}
                    aria-current={room.id === activeRoom?.id}
                  >
                    <span className="room__badge">{room.emoji}</span>
                    <span className="room__text">
                      <strong>{room.name}</strong>
                      <small>{room.topic}</small>
                    </span>
                    {room.unread > 0 && <span className="room__unread">{room.unread}</span>}
                  </button>
                </li>
              ))}

              {chat.status === 'loading' && <li className="chat__empty">Loading...</li>}

              {chat.status === 'ready' && rooms.length === 0 && (
                <li className="chat__empty">
                  {query.trim()
                    ? 'No room found.'
                    : 'You are not in any room yet.'}
                </li>
              )}
            </ul>

            <RoomDirectory
              onJoin={chat.joinRoom}
              onCreate={chat.createRoom}
              empty={chat.status === 'ready' && chat.rooms.length === 0}
              community={community}
            />
          </aside>

          <section
            className="chat__thread"
            aria-label={activeRoom ? `Room ${activeRoom.name}` : 'No room open'}
          >
            {activeRoom ? (
              <>
                <header className="chat__thread-head">
                  <span className="room__badge room__badge--lg">{activeRoom.emoji}</span>
                  <div className="chat__thread-title">
                    <strong>{activeRoom.name}</strong>
                    <span>
                      {chat.members.length} {chat.members.length === 1 ? 'member' : 'members'} - {onlineCount} online
                    </span>
                  </div>
                  <div className="chat__thread-actions">
                    <button type="button" className="icon-btn" aria-label="Audio call">
                      <Icon name="chat" size={17} />
                    </button>
                    <button type="button" className="icon-btn" aria-label="Video call">
                      <Icon name="video" size={17} />
                    </button>
                  </div>
                </header>

                <div className="chat__messages" ref={threadRef}>
                  {thread.map((message) => {
                    const author = usersById.get(message.authorId)
                    const own = message.authorId === user?.id
                    const translatedFrom = translationOf(message, author, user?.language)
                    return (
                      <article
                        key={message.id}
                        className={`bubble bubble--in${own ? ' bubble--own' : ''}`}
                      >
                        <span className="avatar avatar--sm">{author?.initials ?? '??'}</span>
                        <div className="bubble__content">
                          <header className="bubble__meta">
                            <strong>{author?.name ?? 'Member'}</strong>
                            {author && <span className="flag">{author.flag}</span>}
                            <time>{formatDelay(minutesOf(message, now))}</time>
                            {translatedFrom && showLanguage && (
                              <span className="bubble__translated">
                                <Icon name="translate" size={12} />
                                written in {translatedFrom}
                              </span>
                            )}
                          </header>
                          <p>{message.body}</p>
                        </div>
                      </article>
                    )
                  })}

                  {thread.length === 0 && chat.status === 'ready' && (
                    <p className="chat__empty">
                      No messages here yet: start the conversation.
                    </p>
                  )}

                  {typingUser && (
                    <div className="typing" aria-live="polite">
                      <span className="avatar avatar--sm">{typingUser.initials}</span>
                      <span className="typing__dots">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span className="typing__label">
                        {typingUser.name} is typing
                      </span>
                    </div>
                  )}
                </div>

                <form className="composer" onSubmit={send}>
                  <label className="sr-only" htmlFor="composer">
                    Your message
                  </label>
                  <input
                    id="composer"
                    type="text"
                    autoComplete="off"
                    placeholder={`Write in ${activeRoom.name}...`}
                    value={draft}
                    onChange={(event) => handleDraft(event.target.value)}
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    className="btn btn--primary composer__send"
                    disabled={draft.trim().length === 0 || chat.sending}
                  >
                    <Icon name="send" size={17} />
                    <span className="composer__label">
                      {chat.sending ? 'Sending...' : 'Send'}
                    </span>
                  </button>
                </form>
              </>
            ) : (
              <div className="chat__messages">
                <p className="chat__empty">
                  {chat.status === 'loading'
                    ? 'Opening your rooms...'
                    : 'No room to show. Join a community to start chatting.'}
                </p>
              </div>
            )}
          </section>

          <aside className="chat__members" aria-label="Room members">
            <h2 className="chat__members-title">
              Members
              {canModerate && (
                <span className="chat__members-role">
                  {canGrant ? 'You own it' : 'You moderate it'}
                </span>
              )}
            </h2>
            <ul className="chat__member-list">
              {chat.members.map((member) => (
                <li key={member.id} className="member">
                  <span className={`avatar avatar--sm presence presence--${member.presence}`}>
                    {member.initials}
                  </span>
                  <span className="member__text">
                    <strong>
                      {member.name}
                      {member.id === user?.id && <em> (you)</em>}
                      {member.roomRole && member.roomRole !== 'member' && (
                        <span className={`member__role member__role--${member.roomRole}`}>
                          {memberRoleLabel(member.roomRole)}
                        </span>
                      )}
                    </strong>
                    <small>
                      <span className="flag">{member.flag}</span> {member.country} -{' '}
                      {PRESENCE_LABEL[member.presence]}
                    </small>
                  </span>

                  {member.id !== user?.id && (canGrant || canModerate) && (
                    <span className="member__actions">
                      {canGrant && member.roomRole === 'member' && (
                        <button
                          type="button"
                          className="member__action"
                          title={`Make ${member.name} a room moderator`}
                          disabled={busyMember === member.id}
                          onClick={() => void changeRole(member.id, 'moderator')}
                        >
                          <Icon name="shield" size={15} />
                        </button>
                      )}

                      {canGrant && member.roomRole === 'moderator' && (
                        <button
                          type="button"
                          className="member__action"
                          title={`Remove moderator role from ${member.name}`}
                          disabled={busyMember === member.id}
                          onClick={() => void changeRole(member.id, 'member')}
                        >
                          <Icon name="minus" size={15} />
                        </button>
                      )}

                      {canModerate && member.roomRole !== 'owner' && (
                        <button
                          type="button"
                          className="member__action member__action--danger"
                          title={`Remove ${member.name} from the room`}
                          disabled={busyMember === member.id}
                          onClick={() => void excludeMember(member.id, member.name)}
                        >
                          <Icon name="close" size={15} />
                        </button>
                      )}
                    </span>
                  )}
                </li>
              ))}
              {chat.members.length === 0 && <li className="chat__empty">No members.</li>}
            </ul>

            <div className="chat__note">
              <Icon name="lock" size={15} />
              <p>
                Messages travel encrypted with TLS to the
                {' '}
                {content.site.name} server and can only be read by the room's members.{' '}
                <Link to="/security">See the security measures</Link>. Measured response
                time: <Link to="/status">{status.latencyMs} ms</Link>.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </Page>
  )
}
