import { useId } from "react"
import { useIntlayer } from "react-intlayer"
import { cn } from "@/shared/lib/utils"
import type { FeatureItem } from "@/shared/types/landing"
import { getIconComponent } from "../benefits/animated-benefit-card"

const FeatureCard = ({ feature }: { feature: FeatureItem }) => {
  const IconComponent = feature.icon
  const titleId = useId()
  const descId = useId()

  return (
    <article
      className="feature-base group"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div
        className={cn(
          "size-16 mb-6 rounded-full border-2 border-primary/30",
          "flex items-center justify-center bg-transparent",
          "hover:bg-primary/10 transition-all duration-300",
          "focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2"
        )}
        role="img"
        aria-label={`${feature.title} feature icon`}
      >
        <IconComponent
          size={28}
          className={cn("text-primary group-hover:scale-110", "transition-transform duration-300")}
          aria-hidden="true"
        />
      </div>

      <h3
        id={titleId}
        className={cn(
          "text-xl font-semibold text-foreground mb-4",
          "group-hover:text-primary transition-colors duration-300"
        )}
      >
        {feature.title}
      </h3>

      <p
        id={descId}
        className="text-muted-foreground leading-relaxed"
      >
        {feature.description}
      </p>
    </article>
  )
}

export const Features = () => {
  const { features } = useIntlayer("landing")
  const headingId = useId()
  const descriptionId = useId()

  const featureItems: FeatureItem[] = features.items.map((item, index) => ({
    id: `${index}`,
    title: item.title.value,
    description: item.description.value,
    icon: getIconComponent(item.icon.value),
  }))

  return (
    <section
      className="py-20 px-4"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16">
          <h2
            id={headingId}
            className={cn(
              "text-4xl md:text-5xl font-bold text-foreground mb-6",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
              "scroll-mt-20"
            )}
            tabIndex={-1}
          >
            {features.title.value}
          </h2>

          <p
            id={descriptionId}
            className={cn("text-xl text-muted-foreground max-w-3xl mx-auto", "leading-relaxed")}
          >
            {features.description.value}
          </p>
        </header>

        <ul
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            "gap-12 lg:gap-16",
            "list-none"
          )}
          aria-label="Features list"
        >
          {featureItems.map((feature) => (
            <li
              key={feature.id}
              className={cn(
                "focus-within:ring-2 focus-within:ring-primary/50",
                "focus-within:ring-offset-2 rounded-lg"
              )}
            >
              <FeatureCard feature={feature} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
