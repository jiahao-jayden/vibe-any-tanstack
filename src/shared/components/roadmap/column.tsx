import * as Icons from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { ItemCard, type RoadmapItem } from "./item-card"

type ColumnProps = {
  title: string
  icon: string // Must be a Lucide icon name
  color: string // Hex color, e.g. #C084FC
  items: RoadmapItem[]
}

function hexToRGBA(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "")
  const isShort = normalized.length === 3
  const r = parseInt(isShort ? normalized[0] + normalized[0] : normalized.slice(0, 2), 16)
  const g = parseInt(isShort ? normalized[1] + normalized[1] : normalized.slice(2, 4), 16)
  const b = parseInt(isShort ? normalized[2] + normalized[2] : normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function Column({ title, icon, color, items }: ColumnProps) {
  const IconComp = (Icons as Record<string, any>)[icon]
  return (
    <section className={cn("bg-card border rounded-xl shadow-sm")}>
      <header
        className={cn(
          "flex items-center justify-between",
          "md:sticky md:top-0 md:z-10",
          "h-12 px-3",
          "bg-card/95 supports-[backdrop-filter]:bg-card/80 backdrop-blur",
          "border-b rounded-t-xl"
        )}
      >
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "font-semibold pointer-events-none max-w-[265px] px-2 py-1 rounded-md border flex text-xs items-center",
              "bg-gradient-to-r"
            )}
            style={{
              background: `linear-gradient(90deg, ${hexToRGBA(color, 0.12)} 0%, ${hexToRGBA(color, 0.24)} 100%)`,
              borderColor: hexToRGBA(color, 0.3),
              color,
            }}
          >
            <span className="inline-flex items-center truncate first-letter:uppercase">
              <span
                className="mr-1.5 opacity-90 dark:opacity-80"
                style={{ color }}
              >
                {IconComp ? (
                  <IconComp
                    className="w-4 h-4"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
              {title}
            </span>
          </p>
        </div>
        <span className="text-xs !font-semibold bg-white border border-gray-100/50 dark:border-border/60 dark:bg-secondary/60 text-foreground/80 dark:text-foreground/60 rounded-md px-1 py-[3px]">
          {items.length}
        </span>
      </header>

      <div className="p-4 md:max-h-[calc(100%-3rem)] md:overflow-y-auto md:no-scrollbar space-y-4">
        {items.map((item, idx) => (
          <ItemCard
            key={`${item.title}-${idx}`}
            item={item}
          />
        ))}
      </div>
    </section>
  )
}
