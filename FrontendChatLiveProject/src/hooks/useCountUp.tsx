import { useEffect, useInsertionEffect, useRef } from 'react'

export function useCountUp(
  target: number,
  active: boolean,
  format: (value: number) => string,
  duration = 1600,
) {
  const node = useRef<HTMLSpanElement>(null)
  const from = useRef(0)
  const render = useRef(format)
  useInsertionEffect(() => {
    render.current = format
  })

  useEffect(() => {
    const element = node.current
    if (!active || !element) return

    const write = (value: number) => {
      element.textContent = render.current(value)
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced || duration <= 0) {
      write(target)
      from.current = target
      return
    }

    const start = performance.now()
    const origin = from.current
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      write(origin + (target - origin) * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        from.current = target
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, active, duration])

  return node
}
