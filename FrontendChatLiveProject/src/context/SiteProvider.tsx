import type { ReactNode } from 'react'
import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import type { Metric, ServiceStatus, Showcase, SiteBundle, Stat } from '../types'
import { ApiError, showcaseApi, siteApi, statsApi } from '../lib/api'
import { Logo } from '../components/ui/Logo'
import { PageLoader } from '../components/ui/PageLoader'
import { SiteContext, type SiteContextValue } from './site-context'

const REFRESH_MS = 60_000

export function SiteProvider({ children }: { readonly children: ReactNode }) {
  const [content, setContent] = useState<SiteBundle | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState<readonly Stat[]>([])
  const [metrics, setMetrics] = useState<readonly Metric[]>([])
  const [values, setValues] = useState<SiteContextValue['values'] | null>(null)
  const [status, setStatus] = useState<ServiceStatus | null>(null)
  const [showcase, setShowcase] = useState<Showcase | null>(null)

  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([siteApi.bundle(controller.signal), statsApi.read(controller.signal)])
      .then(([bundle, live]) => {
        startTransition(() => {
          setContent(bundle)
          setStats(live.stats)
          setMetrics(live.metrics)
          setValues(live.values)
          setStatus(live.status)
          setError(null)
        })
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(
          cause instanceof ApiError
            ? cause.message
            : 'The site content is temporarily unavailable.',
        )
      })

    showcaseApi
      .read(controller.signal)
      .then(setShowcase)
      .catch(() => {
      })

    return () => controller.abort()
  }, [reload])

  useEffect(() => {
    if (!content) return

    const controller = new AbortController()

    const update = () => {
      if (document.hidden) return

      statsApi
        .read(controller.signal)
        .then((live) => {
          setStats(live.stats)
          setMetrics(live.metrics)
          setValues(live.values)
          setStatus(live.status)
        })
        .catch(() => {
        })

      showcaseApi
        .read(controller.signal)
        .then(setShowcase)
        .catch(() => undefined)
    }

    const timer = window.setInterval(update, REFRESH_MS)
    document.addEventListener('visibilitychange', update)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
      controller.abort()
    }
  }, [content])

  const refresh = useCallback(() => setReload((value) => value + 1), [])

  const value = useMemo<SiteContextValue | null>(() => {
    if (!content || !values || !status) return null

    return {
      content,
      stats: stats.length > 0 ? stats : content.stats,
      metrics: metrics.length > 0 ? metrics : content.metrics,
      values,
      status,
      showcase,
      refresh,
    }
  }, [content, stats, metrics, values, status, showcase, refresh])

  useLayoutEffect(() => {
    if (!value && !error) return
    document.getElementById('boot')?.remove()
  }, [value, error])

  if (error) {
    return (
      <div className="page site-down">
        <div className="card site-down__card" role="alert">
          <Logo size={46} withWordmark={false} />
          <h1>Content unavailable</h1>
          <p>{error}</p>
          <p className="site-down__hint">
            The pages of this site are served by the API: texts, plans, communities and
            figures all come from the server. Check that it is running, then try again.
          </p>
          <button type="button" className="btn btn--primary" onClick={refresh}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!value) return <PageLoader />

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}
