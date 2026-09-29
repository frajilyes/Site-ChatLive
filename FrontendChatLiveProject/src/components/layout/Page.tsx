import type { ReactNode } from 'react'
import { useState } from 'react'
import type { BackgroundVariant } from '../../types'
import { useSeo } from '../../hooks/useSeo'
import { useSite } from '../../hooks/useSite'
import { AnimatedBackground } from '../ui/AnimatedBackground'

interface PageProps {
  readonly description: string
  readonly background: BackgroundVariant
  readonly structuredData?: readonly Record<string, unknown>[]
  readonly children: ReactNode
}

export function Page({ description, background, structuredData, children }: PageProps) {
  const { content } = useSite()

  useSeo({ description, siteName: content.site.name }, structuredData)

  const [instant] = useState(() => document.getElementById('boot') !== null)

  return (
    <div className={instant ? 'page page--instant' : 'page'}>
      <AnimatedBackground variant={background} />
      {children}
    </div>
  )
}
