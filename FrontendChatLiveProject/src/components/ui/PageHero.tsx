import type { ReactNode } from 'react'

interface PageHeroProps {
  readonly eyebrow: string
  readonly title: ReactNode
  readonly description: string
  readonly children?: ReactNode
}

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <header className="page-hero">
      <div className="container page-hero__inner">
        <span className="eyebrow">
          <span className="dot" />
          {eyebrow}
        </span>
        <h1 className="page-hero__title">{title}</h1>
        <p className="page-hero__desc">{description}</p>
        {children && <div className="page-hero__extra">{children}</div>}
      </div>
    </header>
  )
}
