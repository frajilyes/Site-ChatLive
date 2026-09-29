import { startTransition, useEffect, useState, type ReactNode } from 'react'

/**
 * Mounts its children one frame after the surrounding page has painted.
 *
 * Everything below the fold costs about as much DOM as the part the visitor can
 * actually see, and React commits a tree in one uninterruptible task. Splitting
 * that commit in two keeps both halves under the 50 ms that count against Total
 * Blocking Time, at the price of a single frame for content nobody has scrolled
 * to yet.
 */
export function AfterPaint({ children }: { readonly children: ReactNode }) {
  const [painted, setPainted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      startTransition(() => setPainted(true))
    })

    return () => cancelAnimationFrame(frame)
  }, [])

  return painted ? children : null
}
