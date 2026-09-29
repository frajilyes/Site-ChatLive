// Compare deux builds sur les memes routes, pour decider si un changement de
// performance vaut la peine d etre garde.
//
// Pourquoi ce script existe plutot qu un simple « mesurer avant, mesurer apres » :
// une passe Lighthouse isolee sur une machine de travail varie enormement. Sur
// /press, quinze passes du MEME build ont donne des Total Blocking Time allant de
// 25 a 182 ms. Deux series lancees a dix minutes d intervalle ne se comparent
// donc pas : l ecart mesure est surtout celui de la charge de la machine entre
// les deux. Ici les deux builds sont servis en meme temps, sur deux ports, et
// les passes alternent A, B, puis B, A : une derive pendant la serie frappe les
// deux cotes de la meme facon, et la mediane de chaque cote reste comparable.
//
// Avant de croire un ecart, mesurer le bruit du montage avec --null : le meme
// build des deux cotes. A quinze passes l ecart temoin observe ici tombe a
// 12 ms de TBT et 3 ms de Speed Index ; en dessous de cet ordre de grandeur, un
// ecart ne veut rien dire. A six passes il etait encore de 60 ms et 220 ms.
//
// Les deux cotes doivent joindre l API : le cote qui se fait refuser mesure une
// page degradee, donc plus legere, et parait meilleur. Le backend n autorise en
// CORS que les origines listees dans CLIENT_URL ; y ajouter le second port,
// http://localhost:4174, le temps de la comparaison.
//
//   node scripts/perf-ab.mjs --a=dist-base --b=dist /press /api-docs
//   node scripts/perf-ab.mjs --null --a=dist /press
//
// Comparer deux builds servis a des CHEMINS differents ne marche pas : le
// routeur ne reconnait pas le chemin invente et rend la page 404, bien plus
// legere que la page visee. D ou les deux ports.
import { spawn } from 'node:child_process'
import { cp, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import lighthouse, { desktopConfig } from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VITE = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
const METRICS = ['FCP', 'LCP', 'TBT', 'CLS', 'SI']
const AUDITS = {
  FCP: 'first-contentful-paint',
  LCP: 'largest-contentful-paint',
  TBT: 'total-blocking-time',
  CLS: 'cumulative-layout-shift',
  SI: 'speed-index',
}

function parseArgs(argv) {
  const options = { a: 'dist-base', b: 'dist', runs: 15, desktop: false, control: false, routes: [] }

  for (const arg of argv) {
    const [flag, value] = arg.split('=')

    if (flag === '--a') options.a = value
    else if (flag === '--b') options.b = value
    else if (flag === '--runs') options.runs = Number(value)
    else if (flag === '--desktop') options.desktop = true
    else if (flag === '--null') options.control = true
    else if (flag.startsWith('--')) throw new Error(`Option inconnue : ${arg}`)
    else options.routes.push(arg)
  }

  if (options.routes.length === 0) options.routes.push('/')
  return options
}

// Un serveur reste parfois ouvert apres une serie interrompue. Comme
// `--strictPort` fait echouer le nouveau sans bruit pendant que l ancien
// repond, la serie mesurerait ce residu — donc un autre build — en croyant
// mesurer celui qu on lui a demande. Le port doit etre libre avant de servir.
async function requireFreePort(port) {
  try {
    await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(2000) })
  } catch {
    return
  }

  throw new Error(
    `Le port ${port} est deja pris : un serveur d une serie precedente y repond, ` +
      `et la comparaison mesurerait son build. Fermez-le avant de recommencer ` +
      `(netstat -ano | findstr :${port}, puis taskkill /PID <pid> /F).`,
  )
}

async function serve(outDir, port) {
  await requireFreePort(port)

  const child = spawn(
    process.execPath,
    [VITE, 'preview', '--outDir', outDir, '--port', String(port), '--strictPort'],
    { cwd: ROOT, stdio: 'ignore' },
  )

  const origin = `http://localhost:${port}`
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${origin}/`)).ok) return { origin, stop: () => child.kill() }
    } catch {
      // Pas encore a l ecoute.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  child.kill()
  throw new Error(`${outDir} ne repond pas sur ${origin}`)
}

// Mediane basse sur un nombre pair de passes : la plus optimiste des deux
// valeurs centrales ne doit pas parler pour la paire.
function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) / 2)]
}

async function measure(url, port, desktop, attempts = 3) {
  const options = { port, output: 'json', onlyCategories: ['performance'], logLevel: 'error' }

  for (let attempt = 1; ; attempt++) {
    try {
      const { lhr } = desktop
        ? await lighthouse(url, options, desktopConfig)
        : await lighthouse(url, options)

      if (lhr.runtimeError) throw new Error(lhr.runtimeError.message)

      const sample = { score: Math.round(lhr.categories.performance.score * 100) }
      for (const key of METRICS) sample[key] = lhr.audits[AUDITS[key]].numericValue
      return sample
    } catch (error) {
      if (attempt >= attempts) throw error
      await new Promise((resolve) => setTimeout(resolve, 800))
    }
  }
}

function format(key, value) {
  if (key === 'CLS') return value.toFixed(3)
  return `${Math.round(value)}ms`
}

function delta(key, before, after) {
  const gap = after - before
  const sign = gap >= 0 ? '+' : ''
  return key === 'CLS' ? sign + gap.toFixed(3) : `${sign}${Math.round(gap)}ms`
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  // Le mode temoin duplique le meme build des deux cotes : tout ecart affiche
  // est alors du bruit, et donne l echelle en dessous de laquelle rien ne compte.
  const mirror = '.perf-ab-null'
  if (options.control) {
    await rm(join(ROOT, mirror), { recursive: true, force: true })
    await cp(join(ROOT, options.a), join(ROOT, mirror), { recursive: true })
    options.b = mirror
  }

  const sides = [
    { label: options.control ? 'temoin A' : `A ${options.a}`, dir: options.a, port: 4174 },
    { label: options.control ? 'temoin B' : `B ${options.b}`, dir: options.b, port: 4173 },
  ]

  const width = Math.max(...sides.map((side) => side.label.length))
  const servers = []
  for (const side of sides) servers.push(await serve(side.dir, side.port))

  const chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  })

  console.log(
    `\n${sides[0].label} contre ${sides[1].label} — ${options.runs} passes entrelacees ` +
      `(${options.desktop ? 'desktop' : 'mobile'})`,
  )

  try {
    // Les premieres passes d un Chrome neuf paient des caches froids. Elles
    // servent a chauffer, pas a compter.
    for (let pass = 0; pass < 3; pass++) {
      await measure(servers[1].origin + options.routes[0], chrome.port, options.desktop)
    }

    for (const route of options.routes) {
      const samples = sides.map(() => [])

      for (let pass = 0; pass < options.runs; pass++) {
        // L ordre s inverse a chaque passe : aucun cote n est toujours le premier.
        for (const index of pass % 2 === 0 ? [0, 1] : [1, 0]) {
          samples[index].push(
            await measure(servers[index].origin + route, chrome.port, options.desktop),
          )
        }
      }

      const medians = samples.map((runs) =>
        Object.fromEntries(
          ['score', ...METRICS].map((key) => [key, median(runs.map((run) => run[key]))]),
        ),
      )

      console.log(`\n  ${route}`)
      sides.forEach((side, index) => {
        const row = METRICS.map((key) => `${key}=${format(key, medians[index][key])}`)
        console.log(
          `    ${side.label.padEnd(width)}  score=${medians[index].score}  ${row.join('  ')}`,
        )
      })

      const spread = METRICS.map((key) => `${key} ${delta(key, medians[0][key], medians[1][key])}`)
      console.log(`    ${' '.repeat(width)}  ecart B-A :  ${spread.join('  ')}`)
    }
  } finally {
    try {
      await chrome.kill()
    } catch {
      // Le profil temporaire de Chrome resiste parfois au nettoyage sous Windows.
    }
    for (const server of servers) server.stop()
    if (options.control) await rm(join(ROOT, mirror), { recursive: true, force: true })
  }
}

// chrome-launcher peut lever en supprimant son profil temporaire apres une
// execution pourtant saine.
process.on('uncaughtException', (error) => {
  if (error?.code === 'EPERM') return
  throw error
})

await main()
