import { createFileRoute, useSearch } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getBlogPosts, getCategories, mapToBlogPost } from "@/config/content/blog-source"
import BlogGrid from "@/shared/components/blog/blog-grid"
import EmptyBlog from "@/shared/components/blog/empty"
import { LocalizedLink, type To } from "@/shared/components/locale/localized-link"
import { cn } from "@/shared/lib/utils"

export const Route = createFileRoute("/{-$locale}/_main/_landing/blog/")({
  component: BlogListPage,
  validateSearch: (search: Record<string, unknown>) => ({
    cat: typeof search.cat === "string" ? search.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Blog - VibeAny" },
      { name: "description", content: "Latest news, tutorials and updates from VibeAny" },
    ],
  }),
  loader: async ({ params }) => {
    return await getBlogListData({ data: { lang: params.locale } })
  },
})

const getBlogListData = createServerFn({ method: "GET" })
  .inputValidator((params: { lang?: string }) => params)
  .handler(async ({ data: { lang } }) => {
    const posts = getBlogPosts(lang).map(mapToBlogPost)
    const categories = getCategories(lang)
    return { posts, categories }
  })

function BlogListPage() {
  const { posts, categories } = Route.useLoaderData()
  const { cat } = useSearch({ from: "/{-$locale}/_main/_landing/blog/" })

  const allCategories = [{ id: "all", name: "All", slug: "", description: "" }, ...categories]

  const filteredPosts = cat ? posts.filter((post) => post.categories.includes(cat)) : posts

  return (
    <main tabIndex={-1} className="relative z-1 outline-none mb-10">
      <div className={cn("mx-auto w-full max-w-7xl", "px-6 lg:px-8", "pt-24")}>
        <h2 className={cn("text-6xl leading-tight font-medium", "sm:text-4xl sm:leading-10")}>
          Blog
        </h2>

        <nav className="mt-6">
          <ul className="flex items-center gap-6 flex-wrap">
            {allCategories.map((category) => {
              const isActive = (cat || "") === category.slug || (category.id === "all" && !cat)
              const href = category.slug ? `/blog?cat=${category.slug}` : "/blog"

              return (
                <li key={category.id} className="text-lg">
                  <LocalizedLink
                    to={href as To}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      isActive
                        ? "text-foreground"
                        : cn("text-muted-foreground hover:text-foreground")
                    )}
                  >
                    {category.name}
                  </LocalizedLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className={cn("mt-12", "px-6 lg:px-8")}>
        {filteredPosts.length === 0 ? (
          <EmptyBlog />
        ) : (
          <BlogGrid posts={filteredPosts} categories={categories} />
        )}
      </div>
    </main>
  )
}
