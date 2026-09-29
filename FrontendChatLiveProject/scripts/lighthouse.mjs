import { spawn } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, sep } from 'node:path'
import lighthouse, { desktopConfig } from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const METRICS = [
  ['first-contentful-paint', 'FCP'],
  ['largest-contentful-paint', 'LCP'],
  ['total-blocking-time', 'TBT'],
  ['cumulative-layout-shift', 'CLS'],
  ['speed-index', 'SI'],
]

function parseArgs(argv) {
  const only = []
  const options = {
    build: true,
    desktop: false,
    threshold: 100,
    port: 4173,
    runs: 1,
    warmup: 3,
    outDir: 'dist',
  }

  for (const arg of argv) {
    const [flag, value] = arg.split('=')

    if (flag === '--no-build') options.build = false
    else if (flag === '--desktop') options.desktop = true
    else if (flag === '--threshold') options.threshold = Number(value)
    else if (flag === '--port') options.port = Number(value)
    else if (flag === '--runs') options.runs = Number(value)
    else if (flag === '--warmup') options.warmup = Number(value)
    else if (flag === '--out-dir') options.outDir = value
    else if (flag === '--route') only.push(value)
    else throw new Error(`Unknown option: ${arg}`)
  }

  return { ...options, only }
}

// The routes to audit are whatever the build actually pre-rendered, so this
// stays in sync with src/lib/seo.ts without importing it.
async function prerenderedRoutes(outDir) {
  const found = []

  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)

      if (entry.isDirectory()) {
        if (entry.name !== 'assets' && entry.name !== 'fonts') await walk(full)
        continue
      }

      if (!entry.name.endsWith('.html')) continue

      const path = relative(outDir, full).split(sep).join('/')
      found.push(path === 'index.html' ? '/' : `/${path.replace(/\/index\.html$/, '')}`)
    }
  }

  await walk(outDir)
  return found.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))
}

const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
const VITE = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')

// Spawning the JS entry points directly keeps this off npm.cmd, which on
// Windows would need `shell: true` and the escaping problems that come with it.
function run(args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: ROOT, stdio: 'inherit' })

    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${label} exited with ${code}`)),
    )
  })
}

// Un serveur laisse ouvert par une serie interrompue repond sur ce port, et
// `--strictPort` fait echouer le nouveau sans bruit : l audit noterait alors le
// build du residu. Mieux vaut refuser que de mesurer autre chose que dist/.
async function requireFreePort(port) {
  try {
    await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(2000) })
  } catch {
    return
  }

  throw new Error(
    `Port ${port} already answering: a preview server from an earlier run is ` +
      `still up, and this audit would score its build. Close it first ` +
      `(netstat -ano | findstr :${port}, then taskkill /PID <pid> /F).`,
  )
}

async function startPreview(port) {
  await requireFreePort(port)

  const server = spawn(
    process.execPath,
    [VITE, 'preview', '--port', String(port), '--strictPort'],
    { cwd: ROOT, stdio: 'ignore' },
  )

  const origin = `http://localhost:${port}`
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/`)
      if (response.ok) return { origin, stop: () => server.kill() }
    } catch {
      // Not listening yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  server.kill()
  throw new Error(`Preview server did not answer on ${origin}`)
}

async function audit(url, port, desktop) {
  const options = {
    port,
    output: 'json',
    onlyCategories: ['performance'],
    logLevel: 'error',
  }

  const { lhr } = desktop
    ? await lighthouse(url, options, desktopConfig)
    : await lighthouse(url, options)

  if (lhr.runtimeError) throw new Error(lhr.runtimeError.message)

  if (lhr.categories.performance.score === null) throw new Error('No performance score returned')

  return {
    score: Math.round(lhr.categories.performance.score * 100),
    metrics: METRICS.map(([id, label]) => [label, lhr.audits[id].numericValue]),
    // Opportunities worth knowing about even while the score sits at 100.
    flagged: lhr.categories.performance.auditRefs
      .filter((ref) => ref.group === 'diagnostics' || ref.group === 'insights')
      .map((ref) => lhr.audits[ref.id])
      .filter((entry) => entry.score !== null && entry.score < 0.9 && entry.displayValue),
  }
}

// Tracing occasionally fails for reasons that have nothing to do with the page
// (NO_NAVSTART and friends). Retry rather than lose a whole audit to one of them.
async function auditWithRetry(url, port, desktop, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await audit(url, port, desktop)
    } catch (error) {
      if (attempt >= attempts) throw error
      console.log(`       retrying ${url} after: ${error.message}`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

// The lower of the two middle values on an even count: with two runs, the
// optimistic one should not be the one that speaks for the pair.
function median(sorted) {
  return sorted[Math.floor((sorted.length - 1) / 2)]
}

function format(label, value) {
  if (label === 'CLS') return value.toFixed(3)
  return `${Math.round(value)}ms`
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.build) {
    await run([TSC, '-b'], 'tsc')
    await run([VITE, 'build'], 'vite build')
  }

  const outDir = join(ROOT, options.outDir)
  const routes = options.only.length > 0 ? options.only : await prerenderedRoutes(outDir)

  if (routes.length === 0) throw new Error(`No pre-rendered pages found in ${outDir}`)

  const preview = await startPreview(options.port)
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  })

  const profile = options.desktop ? 'desktop' : 'mobile'
  console.log(`\nLighthouse performance (${profile}) - ${routes.length} routes on ${preview.origin}\n`)

  const failures = []
  const width = Math.max(...routes.map((route) => route.length))

  try {
    // The first passes through a freshly launched Chrome are measurably slower
    // than the rest: the HTTP cache, the font cache and V8's compilation caches
    // are all cold, and the profile lives in a brand new temp directory. Measured
    // on the home route, the first three runs reported a Total Blocking Time of
    // 132, 105 and 99 ms where the six that followed reported between 7 and 25 ms
    // — enough to fail a route that is comfortably at 100 once warm. These passes
    // pay that cost without recording it.
    for (let pass = 0; pass < options.warmup; pass++) {
      await auditWithRetry(preview.origin + routes[0], chrome.port, options.desktop)
    }

    for (const route of routes) {
      const results = []
      for (let pass = 0; pass < options.runs; pass++) {
        results.push(await auditWithRetry(preview.origin + route, chrome.port, options.desktop))
      }

      // Lighthouse is noisy, so medians decide. A single unlucky run on a loaded
      // machine should not fail the build; a real regression moves the median.
      // Each metric is taken separately rather than through one "median run":
      // once every route sits at 100, sorting by score no longer orders anything,
      // and the run picked to stand for the rest would carry whatever TBT and
      // Speed Index it happened to draw. The spread keeps the noise visible.
      const scores = results.map((entry) => entry.score).sort((a, b) => a - b)
      const score = median(scores)
      const ok = score >= options.threshold

      if (!ok) failures.push({ route, score })

      const spread =
        scores.length > 1 && scores[0] !== scores[scores.length - 1]
          ? ` (${scores[0]}-${scores[scores.length - 1]})`
          : ''

      const detail = METRICS.map(([, label], index) => {
        const values = results.map((entry) => entry.metrics[index][1]).sort((a, b) => a - b)
        return `${label}=${format(label, median(values))}`
      })

      console.log(
        `${ok ? '  ok ' : ' FAIL'}  ${String(score).padStart(3)}${spread}  ` +
          `${route.padEnd(width)}  ${detail.join('  ')}`,
      )

      // A diagnostic raised by any run is worth printing: the ones that only
      // show up under load are exactly the ones about to become a regression.
      const seen = new Set()
      for (const entry of results.flatMap((run) => run.flagged)) {
        if (seen.has(entry.id)) continue
        seen.add(entry.id)
        console.log(`${' '.repeat(width + 13)}- ${entry.title}: ${entry.displayValue}`)
      }
    }
  } finally {
    try {
      await chrome.kill()
    } catch {
      // Chrome's temp profile sometimes resists cleanup on Windows.
    }
    preview.stop()
  }

  if (failures.length > 0) {
    console.error(
      `\n${failures.length} route(s) below ${options.threshold}: ` +
        failures.map((entry) => `${entry.route} (${entry.score})`).join(', '),
    )
    process.exitCode = 1
    return
  }

  console.log(`\n${routes.length}/${routes.length} routes at ${options.threshold}.`)
}

// chrome-launcher can throw while removing its temp profile after a clean run.
process.on('uncaughtException', (error) => {
  if (error?.code === 'EPERM') return
  throw error
})

await main()
