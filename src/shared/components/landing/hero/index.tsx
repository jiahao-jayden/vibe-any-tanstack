import { Image } from "@unpic/react"
import type { Variants } from "motion/react"
import { useId } from "react"
import { useIntlayer, useLocale } from "react-intlayer"
import { Announcement } from "@/shared/components/landing/hero/announcement"
import { LocalizedLink, type To } from "@/shared/components/locale/localized-link"
import { AnimatedGroup } from "@/shared/components/motion-primitives/animate-group"
import { TextEffect } from "@/shared/components/motion-primitives/text-effect"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
} satisfies { item: Variants }

const containerVariants = {
  container: {
    visible: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.75,
      },
    },
  },
}

export const Hero = () => {
  const { hero } = useIntlayer("landing")
  const { locale } = useLocale()

  const heroTitleId = useId()

  return (
    <header
      className={cn(
        "hero-base",
        "flex flex-col items-center justify-center select-none w-full overflow-x-clip"
      )}
    >
      <main
        className="w-full max-w-full overflow-x-clip"
        aria-label="Main content area"
      >
        {/* Decorative background elements */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 isolate opacity-65 contain-strict pointer-events-none",
            "hidden lg:block"
          )}
        >
          <div
            className={cn(
              "absolute left-0 top-0 w-140 h-320",
              "-translate-y-87.5 -rotate-45 rounded-full",
              "bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]"
            )}
          />
          <div
            className={cn(
              "absolute left-0 top-0 h-320 w-60",
              "-rotate-45 rounded-full [translate:5%_-50%]",
              "bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]"
            )}
          />
          <div
            className={cn(
              "absolute left-0 top-0 h-320 w-60",
              "-translate-y-87.5 -rotate-45",
              "bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]"
            )}
          />
        </div>

        <section
          aria-labelledby={heroTitleId}
          className="relative"
        >
          <div className="relative pt-6 md:pt-10">
            {/* Background gradient overlay */}
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 -z-10 size-full",
                "[background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"
              )}
            />

            <div className="mx-auto max-w-7xl px-6">
              <div className={cn("text-center", "sm:mx-auto lg:mr-auto lg:mt-0")}>
                {/* Announcement section */}
                <AnimatedGroup variants={transitionVariants}>
                  {hero.announcement.show && (
                    <Announcement
                      title={hero.announcement.text.value}
                      href={hero.announcement.href.value}
                      className="mx-auto"
                    />
                  )}
                </AnimatedGroup>

                {/* Main heading */}
                <div id={heroTitleId}>
                  <TextEffect
                    key={`hero-title-${locale}`}
                    preset="fade-in-blur"
                    speedSegment={0.3}
                    as="h1"
                    className={cn(
                      "mt-8 text-balance text-4xl",
                      "select-none cursor-default",
                      "md:text-6xl lg:mt-16 lg:text-7xl xl:text-[5.25rem]"
                    )}
                  >
                    {hero.title.value}
                  </TextEffect>
                </div>

                {/* Description */}
                <TextEffect
                  key={`hero-desc-${locale}`}
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className={cn(
                    "mx-auto mt-8 max-w-2xl text-balance text-lg",
                    "select-none cursor-default"
                  )}
                >
                  {hero.description.value}
                </TextEffect>

                {/* Call-to-action buttons */}
                <fieldset
                  className={cn(
                    "mt-12 flex flex-col items-center justify-center gap-2",
                    "md:flex-row border-0 p-0"
                  )}
                >
                  <legend className="sr-only">Primary action buttons</legend>

                  <AnimatedGroup
                    variants={{
                      ...containerVariants,
                      ...transitionVariants,
                    }}
                    className="contents"
                  >
                    {/* Primary action button */}
                    <div
                      key={1}
                      className={cn(
                        "border bg-foreground/10 p-0.5",
                        "rounded-[calc(var(--radius-xl)+0.125rem)]"
                      )}
                    >
                      <Button
                        asChild
                        size="lg"
                        className={cn("rounded-xl px-5 text-base cursor-pointer")}
                      >
                        <LocalizedLink
                          to={hero.buttons.start.url.value as To}
                          aria-label={`Get started: ${hero.buttons.start.text.value}`}
                        >
                          <span className="text-nowrap">{hero.buttons.start.text.value}</span>
                        </LocalizedLink>
                      </Button>
                    </div>

                    {/* Secondary action button */}
                    <Button
                      key={2}
                      asChild
                      size="lg"
                      variant="ghost"
                      className={cn("h-10.5 rounded-xl px-5 cursor-pointer")}
                    >
                      <LocalizedLink
                        to={hero.buttons.docs.url.value as To}
                        aria-label={`View documentation: ${hero.buttons.docs.text.value}`}
                      >
                        <span className="text-nowrap">{hero.buttons.docs.text.value}</span>
                      </LocalizedLink>
                    </Button>
                  </AnimatedGroup>
                </fieldset>
              </div>
            </div>

            {/* Product preview section */}
            <div
              role="img"
              aria-label="Product preview showcase"
            >
              <AnimatedGroup
                variants={{
                  ...containerVariants,
                  ...transitionVariants,
                }}
              >
                <div
                  className={cn(
                    "relative mt-6 overflow-hidden px-2",
                    "sm:mt-8 sm:px-4",
                    "md:mt-12 md:px-6",
                    "lg:mt-20 lg:px-8"
                  )}
                >
                  {/* Gradient overlay for visual effect */}
                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-0 z-10 bg-linear-to-b",
                      "from-transparent from-35% to-background"
                    )}
                  />

                  {/* Image container with enhanced styling */}
                  {hero.image.enabled && (
                    <div
                      className={cn(
                        "relative mx-auto w-full max-w-6xl overflow-hidden",
                        "border bg-background p-1 rounded-lg",
                        "shadow-lg shadow-zinc-950/15",
                        "ring-1 ring-background inset-shadow-2xs",
                        "dark:inset-shadow-white/20",
                        "sm:rounded-xl sm:p-2",
                        "md:rounded-2xl md:p-3",
                        "lg:p-4"
                      )}
                      role="img"
                      aria-label="Application interface preview"
                    >
                      {/* Dark mode image */}
                      <Image
                        className={cn(
                          "relative aspect-15/8 w-full h-auto hidden",
                          "bg-background object-cover object-center",
                          "select-none pointer-events-none",
                          "rounded-md dark:block",
                          "sm:rounded-lg md:rounded-xl"
                        )}
                        src={hero.image.src.value}
                        alt="Application dashboard preview in dark mode"
                        width={hero.image.width.value}
                        height={hero.image.height.value}
                        layout="constrained"
                        loading="eager"
                        fetchPriority="high"
                      />

                      {/* Light mode image */}
                      <Image
                        className={cn(
                          "relative z-2 aspect-15/8 w-full h-auto",
                          "border border-border/25 object-cover object-center",
                          "select-none pointer-events-none",
                          "rounded-md dark:hidden",
                          "sm:rounded-lg md:rounded-xl"
                        )}
                        src={hero.image.src.value}
                        alt="Application dashboard preview in light mode"
                        width={hero.image.width.value}
                        height={hero.image.height.value}
                        layout="constrained"
                        loading="eager"
                        fetchPriority="high"
                      />
                    </div>
                  )}
                </div>
              </AnimatedGroup>
            </div>
          </div>
        </section>
      </main>
    </header>
  )
}
