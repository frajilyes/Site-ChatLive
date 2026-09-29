import type { CSSProperties, ReactNode } from 'react'
import type { BackgroundVariant } from '../../types'

interface AnimatedBackgroundProps {
  readonly variant: BackgroundVariant
}

const BUBBLES: readonly CSSProperties[] = [
  { width: 26, height: 26, left: '6%', animationDuration: '19s', animationDelay: '0s' },
  { width: 58, height: 58, left: '17%', animationDuration: '26s', animationDelay: '-4s' },
  { width: 14, height: 14, left: '28%', animationDuration: '16s', animationDelay: '-9s' },
  { width: 74, height: 74, left: '39%', animationDuration: '31s', animationDelay: '-2s' },
  { width: 34, height: 34, left: '51%', animationDuration: '22s', animationDelay: '-13s' },
  { width: 18, height: 18, left: '62%', animationDuration: '17s', animationDelay: '-6s' },
  { width: 92, height: 92, left: '72%', animationDuration: '34s', animationDelay: '-17s' },
  { width: 42, height: 42, left: '84%', animationDuration: '24s', animationDelay: '-11s' },
  { width: 22, height: 22, left: '93%', animationDuration: '20s', animationDelay: '-3s' },
]

const LAYERS: Record<BackgroundVariant, ReactNode> = {
  aurora: (
    <>
      <div className="bg__layer l1" />
      <div className="bg__layer l2" />
      <div className="bg__layer l3" />
      <div className="bg__layer l4" />
    </>
  ),
  mesh: (
    <>
      <div className="bg__layer l1" />
      <div className="bg__layer l2" />
      <div className="bg__layer l3" />
      <div className="bg__layer l4" />
    </>
  ),
  orbits: (
    <>
      <div className="bg__layer core" />
      <div className="bg__layer ring r1" />
      <div className="bg__layer ring r2" />
      <div className="bg__layer ring r3" />
      <div className="bg__layer glowline" />
    </>
  ),
  waves: (
    <>
      <div className="bg__layer halo" />
      <div className="bg__layer wave w1" />
      <div className="bg__layer wave w2" />
      <div className="bg__layer wave w3" />
    </>
  ),
  rays: (
    <>
      <div className="bg__layer sun" />
      <div className="bg__layer beam" />
      <div className="bg__layer beam2" />
    </>
  ),
  grid: (
    <>
      <div className="bg__layer stars" />
      <div className="bg__layer glow" />
      <div className="bg__layer plane" />
    </>
  ),
  bubbles: (
    <>
      <div className="bg__layer halo" />
      {BUBBLES.map((style, index) => (
        <div key={index} className="bg__layer bubble" style={style} />
      ))}
    </>
  ),
  pulse: (
    <>
      <div className="bg__layer core" />
      <div className="bg__layer echo" style={{ animationDelay: '0s' }} />
      <div className="bg__layer echo" style={{ animationDelay: '-1.6s' }} />
      <div className="bg__layer echo" style={{ animationDelay: '-3.2s' }} />
    </>
  ),
}

export function AnimatedBackground({ variant }: AnimatedBackgroundProps) {
  return (
    <div className={`bg bg--${variant}`} aria-hidden="true">
      {LAYERS[variant]}
      <div className="bg__overlay" />
      <div className="bg__vignette" />
      <div className="bg__scanlines" />
      <div className="bg__grain" />
    </div>
  )
}
