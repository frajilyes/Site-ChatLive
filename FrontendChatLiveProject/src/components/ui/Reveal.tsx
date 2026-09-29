import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useInView } from '../../hooks/useInView'

interface RevealProps {
  readonly children: ReactNode
  readonly delay?: number
  readonly as?: ElementType
  readonly className?: string
  readonly style?: CSSProperties
}

export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className,
  style,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <Tag
      ref={ref}
      className={`reveal${inView ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ ...style, '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}
