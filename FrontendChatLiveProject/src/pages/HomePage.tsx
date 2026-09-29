import { Page } from '../components/layout/Page'
import { CtaBand } from '../components/home/CtaBand'
import { FeatureGrid } from '../components/home/FeatureGrid'
import { Hero } from '../components/home/Hero'
import { StatsBand } from '../components/home/StatsBand'
import { Steps } from '../components/home/Steps'
import { Testimonials } from '../components/home/Testimonials'
import { AfterPaint } from '../components/ui/AfterPaint'
import { useSite } from '../hooks/useSite'

export default function HomePage() {
  const { content } = useSite()

  return (
    <Page
      description={content.site.description}
      background="aurora"
    >
      <Hero />
      <StatsBand />

      <AfterPaint>
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">
                <span className="dot" />
                Why {content.site.name}
              </span>
              <h2>A conversation with no distance, no barriers, no waiting</h2>
              <p>
                Everything it takes to make 10,000 kilometers disappear, gathered in a
                single app.
              </p>
            </div>
            <FeatureGrid features={content.features} />
          </div>
        </section>

        <Steps />
        <Testimonials />
        <CtaBand />
      </AfterPaint>
    </Page>
  )
}
