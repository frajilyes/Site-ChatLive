import type { ReactNode } from 'react'
import type { IconName } from '../../types'

interface IconProps {
  readonly name: IconName
  readonly size?: number
  readonly className?: string
}

const PATHS: Record<IconName, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  sparkles: (
    <>
      <path d="m12 3 1.9 4.9L19 9.8l-5.1 1.9L12 17l-1.9-5.3L5 9.8l5.1-1.9z" />
      <path d="M18.5 15.5 19.4 18l2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" />
    </>
  ),
  chat: <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.2-4.3A8 8 0 1 1 21 12z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12.4V4a1 1 0 0 1 1-1h8.4a1 1 0 0 1 .7.3l7.6 7.6a1 1 0 0 1 0 1.4l-8.4 8.4a1 1 0 0 1-1.4 0L3.3 13.1a1 1 0 0 1-.3-.7z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
      <circle cx="9.5" cy="7" r="3.5" />
      <path d="M21 20v-1.5a4 4 0 0 0-3-3.9M16.5 3.7a3.5 3.5 0 0 1 0 6.6" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7.5 7.4 5.2a2 2 0 0 0 2.2 0l7.4-5.2" />
    </>
  ),
  shield: <path d="M12 3l7.5 3v5.4c0 4.4-3 8.4-7.5 9.6-4.5-1.2-7.5-5.2-7.5-9.6V6z" />,
  bolt: <path d="M13.5 2 4 13.5h6.2L10 22l9.5-11.5h-6.2z" />,
  translate: (
    <>
      <path d="M3 5h9M7.5 3v2M10.5 5c-.6 4.4-3.3 8-6.5 9.6M6 9.4c1 2.4 3 4.3 5.5 5.1" />
      <path d="m13 21 4-10 4 10M14.6 17.4h4.8" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="12" height="12" rx="2.5" />
      <path d="m15 10.5 5-2.8a.6.6 0 0 1 .9.5v7.6a.6.6 0 0 1-.9.5l-5-2.8z" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="11" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  device: (
    <>
      <rect x="2.5" y="4" width="14" height="11" rx="2" />
      <rect x="15.5" y="9" width="6" height="11" rx="1.8" />
      <path d="M6 19h5" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  'arrow-right': <path d="M4 12h15m-6-6 6 6-6 6" />,
  send: <path d="M4 11.5 20.5 4l-6 16.5-3-7z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20v-.8a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5v.8" />
    </>
  ),
  "user-plus": (
    <>
      <circle cx="9.5" cy="8" r="3.8" />
      <path d="M2.5 20v-.8a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v.8M18 7.5v6M15 10.5h6" />
    </>
  ),
  "log-in": <path d="M14 3h4.5a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5H14M10 8.5 13.5 12 10 15.5M13.5 12H3.5" />,
  "log-out": <path d="M10 3H5.5A1.5 1.5 0 0 0 4 4.5v15A1.5 1.5 0 0 0 5.5 21H10M16.5 8.5 20 12l-3.5 3.5M20 12H9.5" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.4 7.3A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.4 4-1" />
      <path d="M9.8 9.9a3.2 3.2 0 0 0 4.4 4.4M3.5 3.5l17 17" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" />
    </>
  ),
  moon: <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  star: <path d="m12 3.5 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8z" />,
  heart: <path d="M12 20s-7.5-4.4-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.6 12 20 12 20z" />,
  github: (
    <path d="M9 19.5c-4 1.2-4-2.1-5.5-2.5m11 5v-3.2c0-.9.1-1.3-.4-1.8 2.4-.3 4.9-1.2 4.9-5.3a4.1 4.1 0 0 0-1.1-2.9 3.8 3.8 0 0 0-.1-2.9s-.9-.3-3 1.1a10.3 10.3 0 0 0-5.4 0C7.3 5.5 6.4 5.8 6.4 5.8a3.8 3.8 0 0 0-.1 2.9 4.1 4.1 0 0 0-1.1 2.9c0 4.1 2.5 5 4.9 5.3-.4.4-.4.8-.4 1.5V22" />
  ),
  x: <path d="m4 4 7.2 9.2L4.4 20h2.2l5.5-5.9L16.6 20H20l-7.5-9.6L19.5 4h-2.2l-5.1 5.5L8 4z" />,
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 10.5V16M8 7.6v.1M12 16v-3.2a1.9 1.9 0 0 1 3.8 0V16" />
    </>
  ),
  discord: (
    <path d="M8.6 5.5a15 15 0 0 1 6.8 0l.6-1.2c1.6.3 3.1.9 4.4 1.8 1.7 3.6 2.3 7.4 1.9 11.1a15 15 0 0 1-4.5 2.3l-1-1.6M8.6 5.5 8 4.3a13.6 13.6 0 0 0-4.4 1.8C1.9 9.7 1.3 13.5 1.7 17.2a15 15 0 0 0 4.5 2.3l1-1.6M9.3 13.2v.1M14.7 13.2v.1" />
  ),
}

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] ?? PATHS.sparkles}
    </svg>
  )
}
