import { useIntlayer } from "react-intlayer"
import { PricingCards } from "./pricing-cards"

export function Pricing() {
  const content = useIntlayer("pricing")

  return (
    <section
      id="pricing"
      className="py-16 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">{content.title.value}</h1>
          <p>{content.subtitle.value}</p>
        </div>

        <div className="mt-8 md:mt-20">
          <PricingCards />
        </div>
      </div>
    </section>
  )
}
