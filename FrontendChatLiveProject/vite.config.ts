import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import Beasties from 'beasties'
import { transform as minifyCss } from 'lightningcss'
import { build as rolldown } from 'rolldown'
import type { OutputBundle, OutputChunk } from 'rolldown'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import {
  DEFAULT_ORIGIN,
  LEGACY_REDIRECTS,
  NOT_FOUND,
  ROUTES,
  absolute,
  headTags,
  indexableRoutes,
  type SeoRoute,
} from './src/lib/seo.ts'

const STYLESHEET = '/src/index.css?direct'

function criticalCss(path: string): Beasties {
  return new Beasties({
    path,
    publicPath: '/',
    preload: 'media',
    pruneSource: false,
    reduceInlineStyles: false,
    inlineFonts: false,
    preloadFonts: false,
    logLevel: 'warn',
  })
}

function fasterFirstPaint(): Plugin {
  return {
    name: 'chatlive:faster-first-paint',

    transformIndexHtml: {
      order: 'post',

      async handler(html, context) {
        if (context.bundle) return deferApplication(html, context.bundle)

        const linked = html.replace(
          '</head>',
          `  <link rel="stylesheet" href="${STYLESHEET}" />\n  </head>`,
        )

        const server = context.server
        if (!server) return deferApplication(linked)

        const sheet = await server.transformRequest(STYLESHEET)
        if (!sheet) return deferApplication(linked)

        const extractor = criticalCss(server.config.root)
        extractor.getCssAsset = () => sheet.code

        return deferApplication(await extractor.process(linked))
      },
    },
  }
}

async function shrinkDocument(html: string): Promise<string> {
  const blocks: string[] = []
  const keep = (text: string) => `\u0000${blocks.push(text) - 1}\u0000`

  const jobs: Promise<void>[] = []
  let stripped = html.replace(
    /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/g,
    (whole, attrs: string, code: string) => {
      if (/ld\+json/.test(attrs)) return keep(whole)

      const slot = blocks.length
      const token = keep(whole)
      jobs.push(
        shrinkScript(code).then((small) => {
          blocks[slot] = `<script${attrs}>${small}</script>`
        }),
      )
      return token
    },
  )

  stripped = stripped.replace(
    /<style([^>]*)>([\s\S]*?)<\/style>/g,
    (_whole, attrs: string, css: string) =>
      keep(`<style${attrs}>${shrinkStyle(css) ?? css}</style>`),
  )

  await Promise.all(jobs)

  return stripped
    .replace(/<!--[\s\S]*?-->/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/\u0000(\d+)\u0000/g, (_token, index: string) => blocks[Number(index)])
}

const shrunk = new Map<string, Promise<string>>()

function shrinkScript(code: string): Promise<string> {
  const known = shrunk.get(code)
  if (known) return known

  const job = runShrinkScript(code)
  shrunk.set(code, job)
  return job
}

async function runShrinkScript(code: string): Promise<string> {
  const ENTRY = '\u0000inline-script'

  try {
    const bundle = await rolldown({
      input: ENTRY,
      plugins: [
        {
          name: 'chatlive:script-du-document',
          resolveId: (id: string) => (id === ENTRY ? id : null),
          load: (id: string) => (id === ENTRY ? code : null),
        },
      ],
      output: { minify: true, format: 'iife' },
      write: false,
    })

    return bundle.output[0].code.trim()
  } catch {
    return code
  }
}

function shrinkStyle(css: string): string | null {
  try {
    return minifyCss({
      filename: 'document.css',
      code: Buffer.from(css),
      minify: true,
    }).code.toString()
  } catch {
    return null
  }
}

function deferApplication(html: string, bundle?: OutputBundle): string {
  const modules: string[] = []

  let stripped = html.replace(
    /[ \t]*<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"[^>]*>\n?/g,
    (_tag, href: string) => {
      modules.push(href)
      return ''
    },
  )

  let entry = ''
  stripped = stripped.replace(
    /[ \t]*<script type="module"[^>]+src="([^"]+)"[^>]*><\/script>\n?/g,
    (tag: string, src: string) => {
      if (isTooling(src)) return tag
      if (entry) return tag

      entry = src
      return ''
    },
  )

  if (!entry) return html

  for (const href of shellModules(bundle, entry)) {
    if (href !== entry && !modules.includes(href)) modules.push(href)
  }

  const loader = `<script>
      (function () {
        var preloads = ${JSON.stringify(modules)}
        var entry = ${JSON.stringify(entry)}
        var started = false

        var start = function () {
          if (started) return
          started = true

          preloads.forEach(function (href) {
            var link = document.createElement('link')
            link.rel = 'modulepreload'
            link.crossOrigin = 'anonymous'
            link.fetchPriority = 'low'
            link.href = href
            document.head.appendChild(link)
          })

          var script = document.createElement('script')
          script.type = 'module'
          script.crossOrigin = 'anonymous'
          script.fetchPriority = 'low'
          script.src = entry
          document.head.appendChild(script)
        }

        try {
          var observer = new PerformanceObserver(function (list) {
            list.getEntries().forEach(function (paint) {
              if (paint.name !== 'first-contentful-paint') return
              observer.disconnect()
              requestAnimationFrame(start)
            })
          })
          observer.observe({ type: 'paint', buffered: true })
        } catch (error) {
          start()
        }

        setTimeout(start, 1500)
      })()
    </script>`

  return stripped.replace('</body>', `    ${loader}\n  </body>`)
}

function shellModules(bundle: OutputBundle | undefined, entry: string): string[] {
  if (!bundle) return []

  const chunks = new Map<string, OutputChunk>()
  for (const file of Object.values(bundle)) {
    if (file.type === 'chunk') chunks.set(file.fileName, file)
  }

  const root = [...chunks.values()].find((chunk) => entry.endsWith(chunk.fileName))
  if (!root) return []
  const base = entry.slice(0, entry.length - root.fileName.length)

  const shell = new Set<string>()
  const queue = [...root.dynamicImports]

  while (queue.length > 0) {
    const name = queue.shift()!
    if (shell.has(name)) continue
    shell.add(name)

    queue.push(...(chunks.get(name)?.imports ?? []))
  }

  return [...shell].map((name) => `${base}${name}`)
}

function isTooling(src: string): boolean {
  return src.startsWith('/@vite/') || src.startsWith('/@react-refresh')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function seoMarkup(origin: string, route: SeoRoute): string {
  const tags = headTags(origin, route)
  const lines: string[] = [`<title>${escapeHtml(tags.title)}</title>`]

  for (const meta of tags.metas) {
    const key = meta.name ? `name="${meta.name}"` : `property="${meta.property}"`
    lines.push(`<meta ${key} content="${escapeHtml(meta.content)}" data-seo />`)
  }

  for (const link of tags.links) {
    const lang = link.hreflang ? ` hreflang="${link.hreflang}"` : ''
    lines.push(`<link rel="${link.rel}" href="${escapeHtml(link.href)}"${lang} data-seo />`)
  }

  lines.push(
    `<script type="application/ld+json" data-seo>${JSON.stringify(tags.jsonLd).replace(
      /</g,
      '\\u003c',
    )}</script>`,
  )

  return lines.map((line) => `    ${line}`).join('\n')
}

function stripSeo(html: string): string {
  return html
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\n?/g, '')
    .replace(/[ \t]*<(?:meta|link)\b[^>]*\sdata-seo\b[^>]*>\n?/g, '')
    .replace(/[ \t]*<script\b[^>]*\sdata-seo\b[^>]*>[\s\S]*?<\/script>\n?/g, '')
}

function withSeo(html: string, origin: string, route: SeoRoute): string {
  return stripSeo(html).replace('</head>', `${seoMarkup(origin, route)}\n  </head>`)
}

function pageShell(route: SeoRoute): string {
  // `data-route-shell` dit au script du document que ce heros est celui de la
  // route, et non celui de l accueil recopie : il n a donc pas a le retirer.
  return `<main class="main" data-route-shell>
        <div class="page page--instant">
          <header class="page-hero">
            <div class="container page-hero__inner">
              <span class="eyebrow">
                <span class="dot"></span>
                ${escapeHtml(route.eyebrow)}
              </span>
              <h1 class="page-hero__title">${escapeHtml(route.heading)}</h1>
              <p class="page-hero__desc">${escapeHtml(route.lead)}</p>
            </div>
          </header>
        </div>
      </main>`
}

function routeDocument(source: string, origin: string, route: SeoRoute): string {
  const head = withSeo(source, origin, route)
  if (route.path === '/') return head

  return head.replace(/<main class="main">[\s\S]*?<\/main>/, pageShell(route))
}

function robotsTxt(origin: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    '',
    `Sitemap: ${absolute(origin, '/sitemap.xml')}`,
    '',
  ].join('\n')
}

function sitemapXml(origin: string): string {
  const today = new Date().toISOString().slice(0, 10)

  const urls = indexableRoutes().map((route) =>
    [
      '  <url>',
      `    <loc>${escapeHtml(absolute(origin, route.path))}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority.toFixed(1)}</priority>`,
      '  </url>',
    ].join('\n'),
  )

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

function redirectsFile(): string {
  const lines = Object.entries(LEGACY_REDIRECTS).map(
    ([from, to]) => `${from}  ${to}  301!`,
  )

  return [
    ...lines,
    '',
    '# Repli de l application : tout le reste rend la page 404, en 404.',
    '/*  /404.html  404',
    '',
  ].join('\n')
}

function headersFile(): string {
  return [
    '/*',
    ...Object.entries(SECURITY_HEADERS).map(([name, value]) => `  ${name}: ${value}`),
    '',
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/fonts/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/sitemap.xml',
    '  Content-Type: application/xml; charset=utf-8',
    '',
  ].join('\n')
}

function seo(origin: string): Plugin {
  let outDir = 'dist'

  return {
    name: 'chatlive:seo',

    configResolved(config) {
      outDir = config.build.outDir
    },

    configureServer(server) {
      const files: Record<string, { readonly type: string; readonly body: () => string }> = {
        '/robots.txt': { type: 'text/plain; charset=utf-8', body: () => robotsTxt(origin) },
        '/sitemap.xml': { type: 'application/xml; charset=utf-8', body: () => sitemapXml(origin) },
      }

      server.middlewares.use((req, res, next) => {
        const file = files[(req.url || '').split('?')[0]]
        if (!file) return next()

        res.setHeader('Content-Type', file.type)
        res.end(file.body())
      })
    },

    transformIndexHtml: {
      order: 'pre',
      handler: (html) => withSeo(html, origin, ROUTES[0]),
    },

    async writeBundle() {
      const source = await readFile(join(outDir, 'index.html'), 'utf8')

      const finish = async (route: SeoRoute, file: string) => {
        const extractor = criticalCss(outDir)
        const inlined = await extractor.process(routeDocument(source, origin, route))
        const target = join(outDir, file)

        await mkdir(dirname(target), { recursive: true })
        await writeFile(target, await shrinkDocument(inlined), 'utf8')
      }

      await Promise.all([
        ...ROUTES.map((route) =>
          finish(route, route.path === '/' ? 'index.html' : `${route.path.slice(1)}/index.html`),
        ),
        finish(NOT_FOUND, '404.html'),
      ])

      await Promise.all([
        writeFile(join(outDir, 'robots.txt'), robotsTxt(origin), 'utf8'),
        writeFile(join(outDir, 'sitemap.xml'), sitemapXml(origin), 'utf8'),
        writeFile(join(outDir, '_redirects'), redirectsFile(), 'utf8'),
        writeFile(join(outDir, '_headers'), headersFile(), 'utf8'),
      ])

      this.info(
        `${ROUTES.length} pages pre-rendues, plan du site et robots.txt ecrits pour ${origin}`,
      )
    },
  }
}

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
}

export default defineConfig(({ mode }) => {
  const origin = (
    loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL || DEFAULT_ORIGIN
  ).replace(/\/+$/, '')

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      seo(origin),
      fasterFirstPaint(),
    ],
    // Le backend n autorise en CORS que 5173 (dev) et 4173 (preview) : si le port
    // glisse, l API est refusee sans bruit. Mieux vaut echouer tout de suite.
    server: { port: 5173, strictPort: true, headers: SECURITY_HEADERS },
    preview: { port: 4173, strictPort: true, headers: SECURITY_HEADERS },
    build: {
      sourcemap: false,
    },
  }
})
