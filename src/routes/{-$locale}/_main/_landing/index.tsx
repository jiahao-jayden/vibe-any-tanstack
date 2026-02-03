import { createFileRoute } from "@tanstack/react-router"
import { useIntlayer } from "react-intlayer"
import { ThreeBenefits } from "@/shared/components/landing/benefits"
import { Cta } from "@/shared/components/landing/cta"
import { Faq } from "@/shared/components/landing/faq"
import { Features } from "@/shared/components/landing/features"
import { Hero } from "@/shared/components/landing/hero"
import { Introduction } from "@/shared/components/landing/introduction"
import { MediaCoverage } from "@/shared/components/landing/media"
import PowerBy from "@/shared/components/landing/powerby"
import { Pricing } from "@/shared/components/landing/pricing"
import { HorizontalShowcase } from "@/shared/components/landing/showcase"
import { Testimonials } from "@/shared/components/landing/testimonials"

export const Route = createFileRoute("/{-$locale}/_main/_landing/")({
  component: RouteComponent,
  ssr: true,
})

function RouteComponent() {
  const landing = useIntlayer("landing")

  return (
    <div>
      <Hero />
      {landing.powerBy.display && <PowerBy />}
      {landing.threeBenefits.display && <ThreeBenefits />}
      {landing.introduction.display && <Introduction />}
      {landing.features.display && <Features />}
      {landing.pricing.display && <Pricing />}
      {landing.horizontalShowcase.display && <HorizontalShowcase />}
      {landing.userTestimonials.display && <Testimonials />}
      {landing.mediaCoverage.display && <MediaCoverage />}
      {landing.faq.display && <Faq />}
      {landing.cta.display && <Cta />}
    </div>
  )
}
