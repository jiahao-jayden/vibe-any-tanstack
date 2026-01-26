import browserCollections from "fumadocs-mdx:collections/browser"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { Image } from "@unpic/react"
import { useFumadocsLoader } from "fumadocs-core/source/client"
import { ArrowLeft, Calendar, User } from "lucide-react"
import { Suspense } from "react"
import {
  type BlogFrontmatter,
  blogSource,
  getAuthor,
  getCategory,
} from "@/config/content/blog-source"
import blogCss from "@/config/style/blog.css?url"
import { getBlogMDXComponents } from "@/shared/components/blog/custom-mdx-content"
import { LocalizedLink } from "@/shared/components/locale/localized-link"
import { Badge } from "@/shared/components/ui/badge"
import { cn } from "@/shared/lib/utils"
import type { BlogCategory } from "@/shared/types/blog"

const serverLoader = createServerFn({ method: "GET" })
  .inputValidator((params: { slug: string; lang?: string }) => params)
  .handler(async ({ data: { slug, lang } }) => {
    const page = blogSource.getPage([slug], lang)
    if (!page) throw notFound()

    const frontmatter = page.data as BlogFrontmatter
    const author = getAuthor(frontmatter.author, lang)
    const categoriesData = frontmatter.categories
      .map((catSlug: string) => getCategory(catSlug, lang))
      .filter((c): c is BlogCategory => c !== null)

    return {
      path: page.path,
      title: frontmatter.title,
      description: frontmatter.description,
      image: frontmatter.image,
      date: frontmatter.date.toISOString(),
      author: author ?? { id: frontmatter.author, name: frontmatter.author },
      categories: categoriesData,
      tags: frontmatter.tags,
    }
  })

export const Route = createFileRoute("/{-$locale}/_main/_landing/blog/$slug")({
  component: BlogPostPage,
  head: () => ({
    meta: [{ title: "Blog - VibeAny" }],
    links: [{ rel: "stylesheet", href: blogCss }],
  }),
  loader: async ({ params }) => {
    const data = await serverLoader({
      data: {
        slug: params.slug,
        lang: params.locale,
      },
    })
    await clientLoader.preload(data.path)
    return data
  },
})

const clientLoader = browserCollections.blog.createClientLoader({
  component({ default: MDX }) {
    return (
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <MDX components={getBlogMDXComponents()} />
      </article>
    )
  },
})

function BlogPostPage() {
  const data = useFumadocsLoader(Route.useLoaderData())

  return (
    <div className="container mx-auto px-4 py-6">
      <LocalizedLink
        to="/blog"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Blog
      </LocalizedLink>

      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {data.categories.map((category: BlogCategory) => (
              <Badge
                key={category.id}
                variant="secondary"
              >
                {category.name}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl font-bold mb-4">{data.title}</h1>

          {data.description && (
            <p className="text-xl text-muted-foreground mb-6">{data.description}</p>
          )}

          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <User className="size-4" />
              <span>{data.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4" />
              <time dateTime={data.date}>
                {new Date(data.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
          </div>

          {data.image && (
            <div className="aspect-video relative overflow-hidden rounded-xl bg-muted mb-8">
              <Image
                src={data.image}
                alt={data.title}
                layout="fullWidth"
                className="object-cover"
              />
            </div>
          )}
        </header>

        <Suspense fallback={<BlogPostSkeleton />}>{clientLoader.useContent(data.path)}</Suspense>

        {data.tags.length > 0 && (
          <footer className="mt-12 pt-8 border-t">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-2">Tags:</span>
              {data.tags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </footer>
        )}
      </article>
    </div>
  )
}

function BlogPostSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className={cn("h-4 bg-muted rounded w-3/4")} />
      <div className={cn("h-4 bg-muted rounded w-full")} />
      <div className={cn("h-4 bg-muted rounded w-5/6")} />
      <div className={cn("h-4 bg-muted rounded w-2/3")} />
    </div>
  )
}
