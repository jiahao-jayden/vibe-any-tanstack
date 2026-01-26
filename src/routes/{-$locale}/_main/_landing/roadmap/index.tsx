import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRoadmapConfig } from "@/config/content/roadmap-source"
import { Board, type RoadmapColumn } from "@/shared/components/roadmap"
import { cn } from "@/shared/lib/utils"

export const Route = createFileRoute("/{-$locale}/_main/_landing/roadmap/")({
  component: RoadmapPage,
  head: () => ({
    meta: [{ title: "Roadmap" }],
  }),
  loader: async ({ params }) => {
    return await getRoadmapData({ data: { lang: params.locale } })
  },
})

const getRoadmapData = createServerFn({ method: "GET" })
  .inputValidator((params: { lang?: string }) => params)
  .handler(async ({ data: { lang } }): Promise<{ columns: RoadmapColumn[] }> => {
    const columns = getRoadmapConfig(lang)
    return { columns }
  })

function RoadmapPage() {
  const { columns } = Route.useLoaderData()

  return (
    <main
      tabIndex={-1}
      aria-label="Roadmap"
      className={cn(
        "roadmap",
        "relative z-1 outline-none",
        "pt-6 md:pt-10",
        "md:h-[calc(100dvh-0px)]"
      )}
    >
      <div className={cn("mx-auto w-full max-w-7xl", "px-6 lg:px-8")}>
        <h1 className={cn("text-6xl leading-tight font-medium", "sm:text-4xl sm:leading-10")}>
          Roadmap
        </h1>
      </div>

      <div
        className={cn(
          "mx-auto w-full max-w-7xl",
          "px-6 lg:px-8",
          "mt-6",
          "md:h-[calc(100%-6rem)] md:min-h-0"
        )}
      >
        <Board columns={columns} />
      </div>
    </main>
  )
}
