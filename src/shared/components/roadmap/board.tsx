import { Column } from "./column"
import type { RoadmapItem } from "./item-card"

export type RoadmapColumn = {
  key: string
  title: string
  icon: string // Lucide icon name
  color: string // hex color like #C084FC
  items: RoadmapItem[]
}

type BoardProps = {
  columns: RoadmapColumn[]
}

export function Board({ columns }: BoardProps) {
  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {columns.map((col) => (
        <div
          key={col.key}
          className="md:min-h-0 md:h-full"
        >
          <Column
            title={col.title}
            icon={col.icon}
            color={col.color}
            items={col.items}
          />
        </div>
      ))}
    </div>
  )
}
