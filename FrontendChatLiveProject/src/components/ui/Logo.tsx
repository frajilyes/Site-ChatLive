interface LogoProps {
  readonly size?: number
  readonly name?: string
  readonly withWordmark?: boolean
  readonly className?: string
}

export function Logo({ size = 38, name, withWordmark = true, className }: LogoProps) {
  const half = name ? Math.ceil(name.length / 2) : 0

  return (
    <span className={className ? `logo ${className}` : 'logo'}>
      <svg
        className="logo__mark"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label={name ?? 'Logo'}
      >
        <defs>
          <linearGradient id="cl-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8A33" />
            <stop offset="55%" stopColor="#FF6A00" />
            <stop offset="100%" stopColor="#C24A00" />
          </linearGradient>
          <linearGradient id="cl-shine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M24 3.5c11.3 0 20.5 8.6 20.5 19.2 0 10.6-9.2 19.2-20.5 19.2-2.2 0-4.4-.3-6.4-1L7.2 44.3a1.1 1.1 0 0 1-1.5-1.4l3.2-8.2C5.2 31.3 3.5 27.1 3.5 22.7 3.5 12.1 12.7 3.5 24 3.5z"
          fill="url(#cl-grad)"
        />
        <path
          d="M24 3.5c11.3 0 20.5 8.6 20.5 19.2 0 1-.1 2-.3 3C42.6 15.4 34.3 8.6 24 8.6S5.4 15.4 3.8 25.7c-.2-1-.3-2-.3-3C3.5 12.1 12.7 3.5 24 3.5z"
          fill="url(#cl-shine)"
        />

        <g
          className="logo__globe"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="24" cy="22.5" r="9.5" opacity="0.95" />
          <path d="M14.5 22.5h19" opacity="0.9" />
          <ellipse cx="24" cy="22.5" rx="4.4" ry="9.5" opacity="0.9" />
        </g>

        <circle className="logo__pulse" cx="35.5" cy="12.5" r="3.4" fill="#FFFFFF" />
      </svg>

      {withWordmark && name && (
        <span className="logo__word">
          {name.slice(0, half)}
          <span className="logo__word-accent">{name.slice(half)}</span>
        </span>
      )}
    </span>
  )
}
