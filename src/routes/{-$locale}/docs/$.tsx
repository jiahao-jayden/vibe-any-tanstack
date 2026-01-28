import browserCollections from "fumadocs-mdx:collections/browser"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { useFumadocsLoader } from "fumadocs-core/source/client"
import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import defaultMdxComponents from "fumadocs-ui/mdx"
import { source } from "@/config/content/source"
import docsCss from "@/config/style/docs.css?url"
import { getMDXComponents } from "@/shared/components/docs/mdx-components"
import { i18n } from "@/shared/lib/i18n"

export function baseOptions(): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: "Docs",
    },
  }
}

export const Route = createFileRoute("/{-$locale}/docs/$")({
  head: () => ({
    meta: [
      {
        title: "Docs",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: docsCss,
      },
    ],
  }),
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/") ?? []
    const data = await serverLoader({
      data: {
        slugs,
        lang: params.locale,
      },
    })
    await clientLoader.preload(data.path)
    return data
  },
})

const serverLoader = createServerFn({
  method: "GET",
})
  .inputValidator((params: { slugs: string[]; lang?: string }) => params)
  .handler(async ({ data: { slugs, lang } }) => {
    const page = source.getPage(slugs, lang)
    if (!page) throw notFound()

    return {
      path: page.path,
      pageTree: await source.serializePageTree(source.getPageTree(lang)),
    }
  })

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX
            components={{
              ...defaultMdxComponents,
              ...getMDXComponents(),
            }}
          />
        </DocsBody>
      </DocsPage>
    )
  },
})

function Page() {
  const data = useFumadocsLoader(Route.useLoaderData())

  return (
    <DocsLayout
      {...baseOptions()}
      tree={data.pageTree}
    >
      {clientLoader.useContent(data.path)}
    </DocsLayout>
  )
}
