import { Metadata } from 'next'

export const metadata: Metadata = { title: 'About Us' }

export default function AboutPage() {
  return (
    <>
      <div className="border-b">
        <div className="container-custom py-section-sm text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-2">Our Story</p>
          <h1 className="text-h1 font-heading font-semibold">About Us</h1>
        </div>
      </div>

      <div className="container-custom py-section max-w-3xl">
        <div className="prose prose-lg mx-auto space-y-8 text-muted-foreground leading-relaxed">
          <p className="text-foreground text-xl font-heading leading-relaxed">
            We started with a simple belief: everyday objects should be beautiful, functional,
            and made to last. No compromises.
          </p>

          <p>
            Founded in 2024, our store was born from a desire to curate products that bring
            intention to daily life. We partner with artisans and small-batch manufacturers
            who share our commitment to quality materials and thoughtful design.
          </p>

          <div className="grid sm:grid-cols-2 gap-8 py-8 border-y not-prose">
            <div>
              <p className="text-3xl font-heading font-semibold text-foreground">100%</p>
              <p className="text-sm text-muted-foreground mt-1">Ethically sourced materials</p>
            </div>
            <div>
              <p className="text-3xl font-heading font-semibold text-foreground">50+</p>
              <p className="text-sm text-muted-foreground mt-1">Artisan partners worldwide</p>
            </div>
            <div>
              <p className="text-3xl font-heading font-semibold text-foreground">30-Day</p>
              <p className="text-sm text-muted-foreground mt-1">No-questions-asked returns</p>
            </div>
            <div>
              <p className="text-3xl font-heading font-semibold text-foreground">Carbon</p>
              <p className="text-sm text-muted-foreground mt-1">Neutral shipping on every order</p>
            </div>
          </div>

          <h2 className="text-h3 font-heading font-semibold text-foreground">Our Philosophy</h2>
          <p>
            We believe in fewer, better things. Every product in our collection is chosen for
            its craftsmanship, longevity, and the story behind it. We&apos;d rather offer one
            exceptional version of something than ten mediocre options.
          </p>

          <h2 className="text-h3 font-heading font-semibold text-foreground">Sustainability</h2>
          <p>
            From packaging to shipping, we&apos;re committed to reducing our environmental
            footprint. All orders ship in recycled and recyclable materials. We offset 100%
            of carbon emissions from shipping through verified carbon removal projects.
          </p>
        </div>
      </div>
    </>
  )
}
