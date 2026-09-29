import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { PageLoader } from '../ui/PageLoader'
import { CookieConsent } from './CookieConsent'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { ScrollToTop } from './ScrollToTop'

export function Layout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main id="contenu" className="main">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}
