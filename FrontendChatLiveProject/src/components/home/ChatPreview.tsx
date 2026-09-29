import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '../../hooks/useSite'
import { formatMetric } from '../../lib/format'
import { Icon } from '../ui/Icon'

export function ChatPreview() {
  const { showcase, status } = useSite()
  const room = showcase?.room ?? null
  const messages = showcase?.messages ?? []

  return (
    <div className="preview">
      <div className="preview__halo" aria-hidden="true" />

      <div className="preview__card">
        <header className="preview__head">
          <Link to="/communities" className="preview__room">
            <span className="preview__room-badge">{room?.emoji ?? '--'}</span>
            <div>
              <strong>{room?.name ?? 'Showcase room'}</strong>
              <span>
                {room
                  ? `${room.members} member${room.members === 1 ? '' : 's'} - ${room.online} online`
                  : 'Loading preview'}
              </span>
            </div>
          </Link>
          <div className="preview__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </header>

        <div className="preview__body">
          {messages.map((message, index) => (
            <article
              key={message.id}
              className="bubble"
              style={{ '--delay': `${0.25 + index * 0.35}s` } as CSSProperties}
            >
              <span className="avatar avatar--sm">{message.initials}</span>
              <div className="bubble__content">
                <header className="bubble__meta">
                  <strong>{message.author}</strong>
                  <span className="flag">{message.flag}</span>
                  {message.translatedFrom && (
                    <span className="bubble__translated">
                      <Icon name="translate" size={12} />
                      translated from {message.translatedFrom}
                    </span>
                  )}
                </header>
                <p>{message.body}</p>
              </div>
            </article>
          ))}

          {messages.length === 0 && (
            <p className="preview__empty">
              No messages in the showcase room yet.
            </p>
          )}
        </div>

        <Link to="/chat" className="preview__foot" aria-label="Open the chat">
          <span className="preview__input">Write a message...</span>
          <span className="preview__send">
            <Icon name="send" size={16} />
          </span>
        </Link>
      </div>

      <Link to="/features" className="preview__chip preview__chip--latency">
        <Icon name="bolt" size={15} />
        <span>
          <strong>{formatMetric(status.latencyMs)} ms</strong> response time
        </span>
      </Link>

      <Link to="/status" className="preview__chip preview__chip--secure">
        <Icon name="lock" size={15} />
        <span>{formatMetric(status.availability, 2)} % uptime</span>
      </Link>
    </div>
  )
}
