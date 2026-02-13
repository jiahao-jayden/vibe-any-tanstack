import { cn } from "@/shared/lib/utils"

export type RoadmapItem = {
  title: string
  description?: string
}

type ItemCardProps = {
  item: RoadmapItem
  className?: string
}

export function ItemCard({ item, className }: ItemCardProps) {
  return (
    <article className={cn("bg-card rounded-xl border", "p-3 sm:p-4", className)}>
      <h4 className="font-medium text-sm">{item.title}</h4>
      {item.description && (
        <p className="mt-1.5 text-xs text-muted-foreground text-pretty">{item.description}</p>
      )}
    </article>
  )
}
