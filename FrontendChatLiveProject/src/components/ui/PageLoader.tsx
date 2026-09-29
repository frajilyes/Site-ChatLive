import { Logo } from './Logo'

export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <Logo size={52} withWordmark={false} />
      <span className="page-loader__bar">
        <span className="page-loader__fill" />
      </span>
      <span className="sr-only">Loading page</span>
    </div>
  )
}
