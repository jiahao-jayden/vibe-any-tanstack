"use client"

import { Image } from "@unpic/react"
import { LocalizedLink } from "@/shared/components/locale/localized-link"
import { cn } from "@/shared/lib/utils"
import type { ShowcaseCardProps } from "@/shared/types/landing"

/**
 * Reusable showcase card component
 * Can be used in both grid and horizontal layouts
 */
export const ShowcaseCard = ({ item, index, className }: ShowcaseCardProps) => {
  const key = `${item.title}-${index}`

  const cardContent = (
    <div
      key={`card-${key}`}
      className={cn(
        "h-full flex flex-col",
        "bg-card rounded-xl border border-border overflow-hidden",
        "transition-all duration-300",
        item.link && "hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      <div className={cn("aspect-4/3 relative overflow-hidden", "bg-muted rounded-t-lg")}>
        <Image
          src={item.imagePath}
          alt={`Preview of ${item.title}`}
          layout="fullWidth"
          className={cn(
            "object-cover",
            item.link && "transition-transform duration-300 group-hover:scale-105"
          )}
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-4">
        <h3
          className={cn(
            "font-semibold text-lg mb-2",
            item.link && "group-hover:text-primary transition-colors"
          )}
        >
          {item.title}
        </h3>

        <p className={cn("text-muted-foreground text-sm leading-relaxed line-clamp-2")}>
          {item.description}
        </p>
      </div>
    </div>
  )

  if (item.link) {
    return (
      <LocalizedLink
        to={item.link}
        className="group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
        aria-label={`View details for ${item.title}`}
      >
        {cardContent}
      </LocalizedLink>
    )
  }

  return cardContent
}
