import { useId } from "react"
import { useIntlayer } from "react-intlayer"
import { LocalizedLink } from "@/shared/components/locale/localized-link"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"

export const Cta = () => {
  const { cta } = useIntlayer("landing")
  const headingId = useId()

  const title = cta.title.value
  const description = cta.description.value
  const primaryText = cta.primaryButtonText.value
  const primaryHref = cta.primaryButtonHref.value
  const secondaryText = cta.secondaryButtonText.value
  const secondaryHref = cta.secondaryButtonHref.value

  return (
    <section
      className={cn("bg-muted", "py-16 md:py-32")}
      aria-labelledby={headingId}
    >
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h2
            id={headingId}
            className={cn("text-balance font-semibold", "text-4xl lg:text-5xl")}
          >
            {title}
          </h2>
          <p
            className="mt-4"
            aria-describedby={headingId}
          >
            {description}
          </p>

          <div className={cn("mt-12", "flex flex-wrap justify-center gap-4")}>
            <Button
              asChild
              size="lg"
            >
              <LocalizedLink
                to={primaryHref}
                aria-label={`${primaryText} - Primary action`}
              >
                <span>{primaryText}</span>
              </LocalizedLink>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
            >
              <LocalizedLink
                to={secondaryHref}
                aria-label={`${secondaryText} - Secondary action`}
              >
                <span>{secondaryText}</span>
              </LocalizedLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
