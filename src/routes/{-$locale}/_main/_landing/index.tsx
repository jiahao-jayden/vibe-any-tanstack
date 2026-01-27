import { createFileRoute, useMatches } from "@tanstack/react-router"
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
  return (
    <div>
      <Hero />
      <PowerBy />
      <ThreeBenefits />
      <Introduction />
      <Features />
      <Pricing />
      <HorizontalShowcase />
      <Testimonials />
      <MediaCoverage />
      <Faq />
      <Cta />
    </div>
  )
}
