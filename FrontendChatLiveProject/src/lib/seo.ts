export const SITE_NAME = 'ChatLive'

export const DEFAULT_ORIGIN = 'https://chatlive.app'

export const LANG = 'en'
export const LOCALE = 'en_US'

export const OG_IMAGE = '/og-image.png'
export const OG_IMAGE_TYPE = 'image/png'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export const SAME_AS: readonly string[] = []

export type ChangeFreq = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface SeoRoute {
  readonly path: string
  readonly title: string
  readonly description: string
  readonly eyebrow: string
  readonly heading: string
  readonly lead: string
  readonly indexable: boolean
  readonly priority: number
  readonly changefreq: ChangeFreq
  readonly crumb?: string
}

export const ROUTES: readonly SeoRoute[] = [
  {
    path: '/',
    title: 'Talk live, anywhere in the world',
    description:
      'ChatLive brings friends together in real-time rooms: instant messages, the original language flagged on each one, live presence and private conversations.',
    eyebrow: 'Live, anywhere in the world',
    heading: 'Talk to your friends anywhere in the world, live.',
    lead: 'ChatLive brings friends from every corner of the globe together in real-time rooms: instant messages, original language flagged on every message, live presence and conversations that stay between their members.',
    indexable: true,
    priority: 1,
    changefreq: 'weekly',
  },
  {
    path: '/features',
    title: 'Features',
    description:
      "Real time, live presence, each member's language, closed rooms: all of ChatLive's features, and the measured figures that go with them.",
    eyebrow: 'Features',
    heading: 'Everything you need to really talk',
    lead: "A platform built for conversations between friends: fast, understandable in everyone's language, and closed to those who were not invited.",
    indexable: true,
    priority: 0.9,
    changefreq: 'monthly',
    crumb: 'Features',
  },
  {
    path: '/pricing',
    title: 'Pricing',
    description:
      'ChatLive plans, as published: what each one includes, monthly or yearly. No ads, no data reselling.',
    eyebrow: 'Pricing',
    heading: 'Clear pricing, no bad surprises',
    lead: 'No ads, no data reselling.',
    indexable: true,
    priority: 0.9,
    changefreq: 'weekly',
    crumb: 'Pricing',
  },
  {
    path: '/communities',
    title: 'Communities',
    description:
      'Join ChatLive communities from all over the world: languages, technology, cooking, sports, art. Thousands of friends connected around the clock.',
    eyebrow: 'Communities',
    heading: 'Rooms open to the whole world',
    lead: 'Join a community that suits you, or create your own. Every room is moderated, translated and accessible from all your devices.',
    indexable: true,
    priority: 0.8,
    changefreq: 'daily',
    crumb: 'Communities',
  },
  {
    path: '/about',
    title: 'About',
    description:
      'The ChatLive project and the values behind it: a fast chat app that tells you where each message comes from, and that sells nothing.',
    eyebrow: 'About',
    heading: 'Talk without borders',
    lead: 'What ChatLive sets out to do: a fast chat app that tells you where each message comes from, and that sells nothing.',
    indexable: true,
    priority: 0.7,
    changefreq: 'monthly',
    crumb: 'About',
  },
  {
    path: '/help',
    title: 'Help center',
    description:
      'Answers to frequently asked questions about ChatLive, shortcuts to useful pages and ways to reach support.',
    eyebrow: 'Resources',
    heading: 'How can we help you?',
    lead: 'Search the frequently asked questions; if the answer is not there, the contact form passes your question on to the team.',
    indexable: true,
    priority: 0.7,
    changefreq: 'weekly',
    crumb: 'Help',
  },
  {
    path: '/contact',
    title: 'Contact',
    description:
      'Contact ChatLive: questions, reports and suggestions all go through this form. Every message is read, and the reply arrives by email.',
    eyebrow: 'Contact',
    heading: 'A question? Write to us',
    lead: 'Every message is read, and the reply arrives by email.',
    indexable: true,
    priority: 0.7,
    changefreq: 'yearly',
    crumb: 'Contact',
  },
  {
    path: '/security',
    title: 'Security',
    description:
      'The security measures in place on ChatLive and the responsible disclosure process, mechanism by mechanism.',
    eyebrow: 'Security',
    heading: 'What protects your conversations',
    lead: 'No list of purchased certifications: the mechanisms below are the ones the server applies to every request.',
    indexable: true,
    priority: 0.6,
    changefreq: 'monthly',
    crumb: 'Security',
  },
  {
    path: '/register',
    title: 'Sign up',
    description:
      'Create your ChatLive account in under a minute and join your friends in live rooms, anywhere in the world. Free, no credit card.',
    eyebrow: 'Sign up',
    heading: 'Create your ChatLive account',
    lead: "Free, no credit card. A confirmation code is waiting in your inbox, and you're in.",
    indexable: true,
    priority: 0.6,
    changefreq: 'yearly',
    crumb: 'Sign up',
  },
  {
    path: '/api-docs',
    title: 'API documentation',
    description:
      'The HTTP endpoints of ChatLive: authentication, rooms, messages, public content and forms, with the access level each one requires.',
    eyebrow: 'Resources',
    heading: 'API documentation',
    lead: 'Every route the server exposes, with the access level required. The site itself uses nothing else.',
    indexable: true,
    priority: 0.6,
    changefreq: 'monthly',
    crumb: 'API documentation',
  },
  {
    path: '/changelog',
    title: 'Changelog',
    description:
      'The public milestones of ChatLive, from the first version to today, in reverse order: newest first.',
    eyebrow: 'Resources',
    heading: 'Release notes',
    lead: 'What we have shipped, in reverse order: newest first.',
    indexable: true,
    priority: 0.5,
    changefreq: 'weekly',
    crumb: 'Changelog',
  },
  {
    path: '/status',
    title: 'Service status',
    description:
      'Uptime, latency and component status of ChatLive, measured live by the server rather than declared.',
    eyebrow: 'Status',
    heading: 'Live service status',
    lead: 'Availability, latency and the state of each component, measured by the server itself.',
    indexable: true,
    priority: 0.5,
    changefreq: 'daily',
    crumb: 'Status',
  },
  {
    path: '/careers',
    title: 'Careers',
    description:
      'Join ChatLive: no positions are open right now, but an unsolicited application is always read.',
    eyebrow: 'Careers',
    heading: 'Build ChatLive from home',
    lead: 'No positions are open right now, but an unsolicited application is always read.',
    indexable: true,
    priority: 0.5,
    changefreq: 'monthly',
    crumb: 'Careers',
  },
  {
    path: '/press',
    title: 'Press',
    description:
      'ChatLive press kit: official description, measured figures, timeline and a dedicated contact.',
    eyebrow: 'Press',
    heading: 'Press kit',
    lead: 'Everything you need to write about us without having to call us — and how to reach us if you prefer.',
    indexable: true,
    priority: 0.5,
    changefreq: 'monthly',
    crumb: 'Press',
  },
  {
    path: '/privacy',
    title: 'Privacy',
    description:
      'What ChatLive collects, why, for how long, and how to take back control of your data.',
    eyebrow: 'Legal',
    heading: 'Privacy policy',
    lead: 'A short text, because there is not much to declare: we keep the minimum, and you can take it all back.',
    indexable: true,
    priority: 0.3,
    changefreq: 'yearly',
    crumb: 'Privacy',
  },
  {
    path: '/terms',
    title: 'Terms of use',
    description:
      'The rules for using ChatLive: account, content, plans, availability and termination.',
    eyebrow: 'Legal',
    heading: 'Terms of use',
    lead: 'What we owe you, what we expect from you. Written to be read, not skimmed.',
    indexable: true,
    priority: 0.3,
    changefreq: 'yearly',
    crumb: 'Terms',
  },

  {
    path: '/login',
    title: 'Sign in',
    description:
      'Sign in to your ChatLive account to get back to your rooms and chat live with your friends.',
    eyebrow: 'Sign in',
    heading: 'Good to see you again',
    lead: 'Pick up your rooms, your friends and your conversations right where you left them.',
    indexable: false,
    priority: 0.1,
    changefreq: 'yearly',
    crumb: 'Sign in',
  },
  {
    path: '/chat',
    title: 'Chat',
    description:
      'Your real-time rooms: instant messages, the original language of each message and presence indicators.',
    eyebrow: 'Chat',
    heading: 'Your rooms',
    lead: 'Sign in to open your conversations.',
    indexable: false,
    priority: 0.1,
    changefreq: 'daily',
    crumb: 'Chat',
  },
  {
    path: '/verify',
    title: 'Confirm your address',
    description:
      'Enter the six-digit code received by email to activate your ChatLive account.',
    eyebrow: 'Sign up',
    heading: 'Confirm your address',
    lead: 'Enter the six-digit code received by email to activate your account.',
    indexable: false,
    priority: 0.1,
    changefreq: 'yearly',
    crumb: 'Confirm your address',
  },
  {
    path: '/admin',
    title: 'Admin',
    description:
      'Edit the site content: identity, navigation, plans, team, testimonials and communities.',
    eyebrow: 'Admin',
    heading: 'The site content, editable here',
    lead: 'Texts, plans, team, communities: everything the pages show is read from the database.',
    indexable: false,
    priority: 0.1,
    changefreq: 'monthly',
    crumb: 'Admin',
  },
]

export const NOT_FOUND: SeoRoute = {
  path: '/404',
  title: 'Page not found',
  description:
    'This page does not exist or has been moved. Find the chat, the communities and the other sections of ChatLive.',
  eyebrow: 'Error 404',
  heading: 'This page does not exist',
  lead: 'The address may have changed, or the link that brought you here may be out of date.',
  indexable: false,
  priority: 0,
  changefreq: 'yearly',
}

export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  '/home': '/',
  '/fonctionnalites': '/features',
  '/messagerie': '/chat',
  '/communautes': '/communities',
  '/tarifs': '/pricing',
  '/a-propos': '/about',
  '/connexion': '/login',
  '/inscription': '/register',
  '/confirmation': '/verify',
  '/administration': '/admin',
  '/carrieres': '/careers',
  '/presse': '/press',
  '/aide': '/help',
  '/statut': '/status',
  '/documentation-api': '/api-docs',
  '/journal': '/changelog',
  '/confidentialite': '/privacy',
  '/conditions': '/terms',
  '/securite': '/security',
}

export function indexableRoutes(): readonly SeoRoute[] {
  return ROUTES.filter((route) => route.indexable)
}

export function normalizePath(pathname: string): string {
  const clean = pathname.split('?')[0].split('#')[0]
  const slashed = clean.startsWith('/') ? clean : `/${clean}`
  const trimmed = slashed.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

export function routeFor(pathname: string): SeoRoute {
  const path = normalizePath(pathname)
  const target = LEGACY_REDIRECTS[path] ?? path
  return ROUTES.find((route) => route.path === target) ?? NOT_FOUND
}

export function absolute(origin: string, path: string): string {
  const base = origin.replace(/\/+$/, '')
  return path === '/' ? `${base}/` : `${base}${normalizePath(path)}`
}

export function pageTitle(route: SeoRoute, siteName: string = SITE_NAME): string {
  return route.path === '/' ? `${siteName} - ${route.title}` : `${route.title} | ${siteName}`
}

type Json = Record<string, unknown>

export function organizationLd(origin: string, email?: string): Json {
  return {
    '@type': 'Organization',
    '@id': `${absolute(origin, '/')}#organization`,
    name: SITE_NAME,
    url: absolute(origin, '/'),
    logo: { '@type': 'ImageObject', url: absolute(origin, '/favicon.svg') },
    ...(email ? { email } : {}),
    ...(SAME_AS.length > 0 ? { sameAs: SAME_AS } : {}),
  }
}

export function websiteLd(origin: string, description: string): Json {
  return {
    '@type': 'WebSite',
    '@id': `${absolute(origin, '/')}#website`,
    name: SITE_NAME,
    url: absolute(origin, '/'),
    description,
    inLanguage: LANG,
    publisher: { '@id': `${absolute(origin, '/')}#organization` },
  }
}

export function softwareApplicationLd(origin: string, description: string): Json {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${absolute(origin, '/')}#application`,
    name: SITE_NAME,
    url: absolute(origin, '/'),
    description,
    applicationCategory: 'CommunicationApplication',
    operatingSystem: 'Web, iOS, Android',
    inLanguage: LANG,
    publisher: { '@id': `${absolute(origin, '/')}#organization` },
  }
}

export function webPageLd(origin: string, route: SeoRoute, title: string): Json {
  const url = absolute(origin, route.path)
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description: route.description,
    inLanguage: LANG,
    isPartOf: { '@id': `${absolute(origin, '/')}#website` },
    primaryImageOfPage: { '@type': 'ImageObject', url: absolute(origin, OG_IMAGE) },
    ...(route.crumb ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
  }
}

export function breadcrumbLd(origin: string, route: SeoRoute): Json | null {
  if (!route.crumb) return null

  const url = absolute(origin, route.path)
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absolute(origin, '/') },
      { '@type': 'ListItem', position: 2, name: route.crumb, item: url },
    ],
  }
}

export function structuredData(
  origin: string,
  route: SeoRoute,
  title: string,
  extras: readonly Json[] = [],
): Json {
  const graph: Json[] = [
    organizationLd(origin),
    websiteLd(origin, ROUTES[0].description),
    webPageLd(origin, route, title),
  ]

  if (route.path === '/') graph.push(softwareApplicationLd(origin, route.description))

  const crumbs = breadcrumbLd(origin, route)
  if (crumbs) graph.push(crumbs)

  graph.push(...extras)

  return { '@context': 'https://schema.org', '@graph': graph }
}

export interface MetaTag {
  readonly name?: string
  readonly property?: string
  readonly content: string
}

export interface LinkTag {
  readonly rel: string
  readonly href: string
  readonly hreflang?: string
}

export interface HeadTags {
  readonly title: string
  readonly metas: readonly MetaTag[]
  readonly links: readonly LinkTag[]
  readonly jsonLd: Json
}

export function headTags(
  origin: string,
  route: SeoRoute,
  overrides: {
    readonly title?: string
    readonly description?: string
    readonly siteName?: string
  } = {},
): HeadTags {
  const canonical = absolute(origin, route.path)
  const description = overrides.description?.trim() || route.description
  const title = overrides.title?.trim() || pageTitle(route, overrides.siteName || SITE_NAME)
  const image = absolute(origin, OG_IMAGE)
  const alt = `${SITE_NAME} - ${route.title}`

  const robots = route.indexable
    ?
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    :
      'noindex, follow'

  return {
    title,
    metas: [
      { name: 'description', content: description },
      { name: 'robots', content: robots },
      { name: 'googlebot', content: robots },
      { name: 'application-name', content: SITE_NAME },
      { name: 'apple-mobile-web-app-title', content: SITE_NAME },

      { property: 'og:type', content: route.path === '/' ? 'website' : 'article' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:locale', content: LOCALE },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: image },
      { property: 'og:image:type', content: OG_IMAGE_TYPE },
      { property: 'og:image:width', content: String(OG_IMAGE_WIDTH) },
      { property: 'og:image:height', content: String(OG_IMAGE_HEIGHT) },
      { property: 'og:image:alt', content: alt },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:image:alt', content: alt },
    ],
    links: [
      { rel: 'canonical', href: canonical },
      { rel: 'alternate', href: canonical, hreflang: 'x-default' },
    ],
    jsonLd: structuredData(origin, route, title),
  }
}
