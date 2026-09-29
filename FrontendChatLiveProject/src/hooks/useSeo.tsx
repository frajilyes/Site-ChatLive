import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { headTags, routeFor, structuredData, LANG } from '../lib/seo'
import { SITE_ORIGIN } from '../lib/site-url'

type Json = Record<string, unknown>

export function useSeo(
  overrides: {
    readonly title?: string
    readonly description?: string
    readonly siteName?: string
  } = {},
  extras: readonly Json[] = [],
) {
  const { pathname } = useLocation()
  const { title, description, siteName } = overrides

  const extrasKey = useMemo(() => JSON.stringify(extras), [extras])

  useEffect(() => {
    const route = routeFor(pathname)
    const tags = headTags(SITE_ORIGIN, route, { title, description, siteName })
    const head = document.head

    head.querySelectorAll('[data-seo]').forEach((node) => node.remove())

    document.title = tags.title
    document.documentElement.lang = LANG

    const fragment = document.createDocumentFragment()

    for (const meta of tags.metas) {
      const node = document.createElement('meta')
      if (meta.name) node.setAttribute('name', meta.name)
      if (meta.property) node.setAttribute('property', meta.property)
      node.setAttribute('content', meta.content)
      node.dataset.seo = ''
      fragment.appendChild(node)
    }

    for (const link of tags.links) {
      const node = document.createElement('link')
      node.setAttribute('rel', link.rel)
      node.setAttribute('href', link.href)
      if (link.hreflang) node.setAttribute('hreflang', link.hreflang)
      node.dataset.seo = ''
      fragment.appendChild(node)
    }

    const graph = document.createElement('script')
    graph.type = 'application/ld+json'
    graph.dataset.seo = ''
    graph.textContent = JSON.stringify(
      extras.length > 0
        ? structuredData(SITE_ORIGIN, route, tags.title, extras)
        : tags.jsonLd,
    )
    fragment.appendChild(graph)

    head.appendChild(fragment)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, title, description, siteName, extrasKey])
}
