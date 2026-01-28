"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { cn } from "@/shared/lib/utils"
import { getScrollButtonClasses } from "./get-scroll-button-classes"
import { ShowcaseCard } from "./shared/showcase-card"
import { ShowcaseHeader } from "./shared/showcase-header"

const CARD_WIDTH = 320
const SCROLL_DISTANCE = CARD_WIDTH * 2

export const HorizontalShowcase = () => {
  const { horizontalShowcase } = useIntlayer("landing")
  const titleId = useId()
  const scrollRef = useRef<HTMLUListElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const items = horizontalShowcase.items.map((item, index) => ({
    id: `${index}`,
    title: item.title.value,
    description: item.description.value,
    imagePath: typeof item.imagePath === "string" ? item.imagePath : item.imagePath.value,
    link: item.link.value,
  }))

  /**
   * Handle scroll state updates based on current scroll position
   */
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  /**
   * Scroll left by predefined distance
   */
  const scrollLeft = useCallback(() => {
    if (!scrollRef.current) return

    scrollRef.current.scrollBy({
      left: -SCROLL_DISTANCE,
      behavior: "smooth",
    })
  }, [])

  /**
   * Scroll right by predefined distance
   */
  const scrollRight = useCallback(() => {
    if (!scrollRef.current) return

    scrollRef.current.scrollBy({
      left: SCROLL_DISTANCE,
      behavior: "smooth",
    })
  }, [])

  /**
   * Handle keyboard navigation for accessibility
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        scrollLeft()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        scrollRight()
      }
    },
    [scrollLeft, scrollRight]
  )

  // Initialize scroll state on component mount
  useEffect(() => {
    handleScroll()
  }, [handleScroll])

  return (
    <section
      className="showcase-horizontal py-16 px-4 sm:px-6 lg:px-8"
      aria-labelledby={titleId}
    >
      <div className="max-w-7xl mx-auto">
        <ShowcaseHeader
          title={horizontalShowcase.title.value}
          description={horizontalShowcase.description.value}
          titleId={titleId}
        />

        {/* Scroll Container */}
        <section
          className="relative"
          onKeyDown={handleKeyDown}
          aria-label="Horizontal scrollable showcase"
        >
          {/* Left Scroll Button */}
          <button
            type="button"
            onClick={scrollLeft}
            className={cn(getScrollButtonClasses(canScrollLeft), "left-0")}
            disabled={!canScrollLeft}
            aria-label="Scroll left to view previous items"
            tabIndex={canScrollLeft ? 0 : -1}
          >
            <ChevronLeft
              className="w-5 h-5"
              aria-hidden="true"
            />
          </button>

          {/* Right Scroll Button */}
          <button
            type="button"
            onClick={scrollRight}
            className={cn(getScrollButtonClasses(canScrollRight), "right-0")}
            disabled={!canScrollRight}
            aria-label="Scroll right to view more items"
            tabIndex={canScrollRight ? 0 : -1}
          >
            <ChevronRight
              className="w-5 h-5"
              aria-hidden="true"
            />
          </button>

          {/* Card Scroll Area */}
          <ul
            ref={scrollRef}
            onScroll={handleScroll}
            className={cn(
              "flex items-stretch gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
            )}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            aria-label="Showcase items"
          >
            {items.map((item, index) => {
              const key = `${item.title}-${index}`

              return (
                <li
                  key={key}
                  className="h-auto"
                >
                  <ShowcaseCard
                    item={item}
                    index={index}
                    className="shrink-0 w-80 h-full"
                  />
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </section>
  )
}
