import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

export interface LegalSection {
  readonly id: string
  readonly title: string
  readonly body: ReactNode
}

interface LegalDocProps {
  readonly sections: readonly LegalSection[]
  readonly updated: string
  readonly aside?: ReactNode
}

export function LegalDoc({ sections, updated, aside }: LegalDocProps) {
  const [current, setCurrent] = useState(() => sections[0]?.id ?? '')
  const nodes = useRef(new Map<string, HTMLElement>())

  const order = useMemo(() => sections.map((section) => section.id), [sections])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id
          if (entry.isIntersecting) visible.add(id)
          else visible.delete(id)
        }
        const first = order.find((id) => visible.has(id))
        if (first) setCurrent(first)
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 },
    )

    for (const node of nodes.current.values()) observer.observe(node)
    return () => observer.disconnect()
  }, [order])

  return (
    <div className="container doc">
      <aside className="doc__aside">
        <div className="doc__nav-card card">
          <p className="doc__updated">
            Last updated
            <strong>{updated}</strong>
          </p>
          <nav aria-label="Table of contents">
            <ol className="doc__nav">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`doc__nav-link${current === section.id ? ' is-active' : ''}`}
                    aria-current={current === section.id ? 'true' : undefined}
                  >
                    <span className="doc__nav-num">{String(index + 1).padStart(2, '0')}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          {aside && <div className="doc__aside-extra">{aside}</div>}
        </div>
      </aside>

      <div className="doc__body">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className="doc__section"
            ref={(node) => {
              if (node) nodes.current.set(section.id, node)
              else nodes.current.delete(section.id)
            }}
          >
            <h2>
              <span className="doc__section-num">{String(index + 1).padStart(2, '0')}</span>
              {section.title}
            </h2>
            {section.body}
          </section>
        ))}
      </div>
    </div>
  )
}
