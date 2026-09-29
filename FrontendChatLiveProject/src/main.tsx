import './index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error("Root element #root not found in index.html")
}

// Yield once the modules have evaluated, so evaluating them and rendering the
// first tree land in two separate tasks instead of one long one.
function breathe(): Promise<void> {
  const { scheduler } = window as unknown as {
    scheduler?: { yield?: () => Promise<void> }
  }
  if (scheduler && typeof scheduler.yield === 'function') return scheduler.yield()

  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

void Promise.all([
  import('react'),
  import('react-dom/client'),
  import('./AppTree'),
]).then(async ([{ startTransition }, { createRoot }, { tree }]) => {
  await breathe()

  // The pre-rendered shell is already on screen, so the first render owes the
  // user nothing immediately: at transition priority React interrupts its own
  // reconciliation every few milliseconds, which keeps this work off the long
  // tasks Lighthouse counts against Total Blocking Time.
  const root = createRoot(container)
  startTransition(() => root.render(tree()))
})
