import browserCollections from "fumadocs-mdx:collections/browser"
import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { Suspense } from "react"
import { getBlogMDXComponents } from "@/shared/components/blog/custom-mdx-content"
import { mdxExtras, Timeline, TimelineItem } from "@/shared/components/changelog"
import { cn } from "@/shared/lib/utils"

type ChangelogEntry = {
  slug: string
  path: string
  title: string
  date: string
  version?: string
  tags: string[]
}

function formatDate(date: Date, locale = "en"): string {
  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const clientLoader = browserCollections.changelog.createClientLoader({
  component({ default: MDX }) {
    return <MDX components={getBlogMDXComponents(mdxExtras)} />
  },
})

export const Route = createFileRoute("/{-$locale}/_main/_landing/changelog")({
  component: ChangelogPage,
  head: () => ({
    meta: [{ title: "Changelog" }],
  }),
  loader: async ({ params }) => {
    const data = await getChangelogData({ data: { lang: params.locale } })
    await Promise.all(data.entries.map((entry) => clientLoader.preload(entry.path)))
    return data
  },
})

const getChangelogData = createServerFn({ method: "GET" })
  .inputValidator((params: { lang?: string }) => params)
  .handler(async ({ data: { lang } }): Promise<{ entries: ChangelogEntry[]; lang: string }> => {
    const { getChangelogs } = await import("@/config/content/changelog-source")
    const entries = getChangelogs(lang)
    return { entries, lang: lang || "en" }
  })

function ChangelogPage() {
  const { entries, lang } = Route.useLoaderData()

  return (
    <main
      tabIndex={-1}
      className={cn("relative z-1 outline-none mb-10", "pt-6 md:pt-10")}
    >
      <div className={cn("mx-auto w-full max-w-5xl", "px-6 lg:px-8")}>
        <h1 className={cn("text-6xl leading-tight font-medium", "sm:text-4xl sm:leading-10")}>
          Changelog
        </h1>
      </div>

      <div className={cn("mx-auto w-full max-w-5xl", "px-6 lg:px-8", "mt-10")}>
        <Timeline>
          {entries.map((entry) => (
            <ChangelogItem
              key={entry.slug}
              entry={entry}
              lang={lang}
            />
          ))}
        </Timeline>
      </div>
    </main>
  )
}

function ChangelogItem({ entry, lang }: { entry: ChangelogEntry; lang: string }) {
  return (
    <TimelineItem
      date={formatDate(new Date(entry.date), lang)}
      version={entry.version}
      title={entry.title}
      tags={entry.tags}
    >
      <Suspense fallback={<ChangelogSkeleton />}>{clientLoader.useContent(entry.path)}</Suspense>
    </TimelineItem>
  )
}

function ChangelogSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
    </div>
  )
}
