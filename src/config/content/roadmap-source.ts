import { roadmap } from "fumadocs-mdx:collections/server"
import type { RoadmapColumn } from "@/shared/components/roadmap"
import { i18n } from "@/shared/lib/i18n"

function getLocaleFromPath(path: string): string {
  const match = path.match(/config\.([a-z]{2})\.json$/)
  return match?.[1] || i18n.defaultLanguage
}

export function getRoadmapConfig(lang?: string): RoadmapColumn[] {
  const language = lang || i18n.defaultLanguage
  const config = roadmap.find((r) => getLocaleFromPath(r.info.path) === language)

  if (!config?.columns) return []

  return config.columns.map((col, idx) => ({
    key: String(idx),
    title: col.title,
    icon: col.icon,
    color: col.color,
    items: col.items || [],
  }))
}
