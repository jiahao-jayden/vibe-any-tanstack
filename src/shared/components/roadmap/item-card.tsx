"use client"

import { cn } from "@/shared/lib/utils"

export type RoadmapItem = {
  title: string
}

type ItemCardProps = {
  item: RoadmapItem
  className?: string
}

export function ItemCard({ item, className }: ItemCardProps) {
  return (
    <article
      className={cn(
        "bg-card rounded-xl border",
        "p-4 sm:p-5",
        "flex items-start justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0">
        <h4 className={cn("font-medium text-base sm:text-lg", "truncate")}>{item.title}</h4>
      </div>
    </article>
  )
}
