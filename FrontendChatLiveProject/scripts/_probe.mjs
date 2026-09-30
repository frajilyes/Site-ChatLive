// Dumps one warm Lighthouse run on a route and prints where the time goes:
// LCP element, filmstrip, long tasks and the critical requests.
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import lighthouse, { desktopConfig } from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VITE = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
// Le profil se lit ou qu il soit ecrit : les deux autres arguments sont
// positionnels, et l oublier mesurerait le telephone en croyant noter le bureau.
const argv = process.argv.slice(2)
const desktop = argv.includes('--desktop')
const positional = argv.filter((arg) => !arg.startsWith('--'))
const route = positional[0] ?? '/'
const outDir = positional[1] ?? 'dist'
const port = 4173

const server = spawn(process.execPath, [VITE, 'preview', '--outDir', outDir, '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: 'ignore' })
const origin = `http://localhost:${port}`
for (let i = 0; i < 120; i++) {
  try { if ((await fetch(origin + '/')).ok) break } catch {}
  await new Promise((r) => setTimeout(r, 250))
}

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] })
const opts = { port: chrome.port, output: 'json', onlyCategories: ['performance'], logLevel: 'error' }

let lhr
for (let pass = 0; pass < 4; pass++)
  ({ lhr } = desktop
    ? await lighthouse(origin + route, opts, desktopConfig)
    : await lighthouse(origin + route, opts))

const a = lhr.audits
const n = (id) => Math.round(a[id]?.numericValue ?? -1)
console.log(`\n=== ${route} (${outDir}) score ${Math.round(lhr.categories.performance.score * 100)} ===`)
console.log(`FCP ${n('first-contentful-paint')}  LCP ${n('largest-contentful-paint')}  TBT ${n('total-blocking-time')}  SI ${n('speed-index')}  CLS ${a['cumulative-layout-shift'].numericValue}`)

console.log('\n--- LCP element ---')
console.log(JSON.stringify(a['largest-contentful-paint-element']?.details?.items ?? [], null, 1).slice(0, 1200))

console.log('\n--- LCP phases ---')
for (const it of a['largest-contentful-paint-element']?.details?.items?.[1]?.items ?? []) console.log(' ', it.phase, Math.round(it.timing))

console.log('--- filmstrip ---')
const dir = process.env.SHOT_DIR
for (const [i, f] of (a['screenshot-thumbnails']?.details?.items ?? []).entries()) {
  console.log('  t=' + Math.round(f.timing) + 'ms')
  if (!dir) continue
  const b64 = String(f.data).split(',').pop()
  writeFileSync(join(dir, String(i).padStart(2, '0') + '-' + Math.round(f.timing) + 'ms.jpg'), Buffer.from(b64, 'base64'))
}

console.log('\n--- main-thread work ---')
for (const it of a['mainthread-work-breakdown']?.details?.items ?? []) console.log('  ' + String(Math.round(it.duration)).padStart(6) + 'ms  ' + it.group)

console.log('\n--- long tasks ---')
for (const it of a['long-tasks']?.details?.items ?? []) console.log('  ' + String(Math.round(it.duration)).padStart(6) + 'ms  start ' + Math.round(it.startTime) + '  ' + it.url)

console.log('\n--- network (critical, simulated) ---')
for (const it of (a['network-requests']?.details?.items ?? [])) {
  if (it.resourceSize < 500 && it.resourceType !== 'Document') continue
  console.log('  ' + String(Math.round(it.networkEndTime)).padStart(6) + 'ms end  ' + String(it.transferSize).padStart(7) + 'B  ' + (it.priority ?? '').padEnd(8) + (it.resourceType ?? '').padEnd(11) + it.url.replace(origin, ''))
}

console.log('\n--- diagnostics below 0.9 ---')
for (const ref of lhr.categories.performance.auditRefs) {
  const e = a[ref.id]
  if (e && e.score !== null && e.score < 0.9) console.log('  ' + e.id + ': ' + (e.displayValue ?? ''))
}

// `kill()` supprime le profil temporaire de facon synchrone, et Windows le
// refuse encore assez souvent (EPERM) : sans ce filet l erreur remonte apres
// la mesure, le serveur de preview reste debout et la sonde sort en echec
// alors qu elle a tout dit.
try {
  await chrome.kill()
} catch {
  // Profil laisse au menage de Windows.
}

server.kill()
