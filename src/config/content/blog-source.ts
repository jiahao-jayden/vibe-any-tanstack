import { authors, blog, categories } from "fumadocs-mdx:collections/server"
import { loader } from "fumadocs-core/source"
import { toFumadocsSource } from "fumadocs-mdx/runtime/server"
import { i18n } from "@/shared/lib/i18n"
import type { BlogAuthor, BlogCategory, BlogPost } from "@/shared/types/blog"

export type BlogFrontmatter = {
  title: string
  description?: string
  image?: string
  date: Date
  published: boolean
  categories: string[]
  author: string
  tags: string[]
}

export const blogSource = loader({
  baseUrl: "/blog",
  source: toFumadocsSource(blog, []),
  i18n,
})

function getInfoFromPath(path: string): { id: string; lang: string } {
  const parts = path.split("/")
  const filename = parts[parts.length - 1]
  const match = filename.match(/^(.+?)(?:\.([a-z]{2}))?\.mdx?$/)
  if (!match) return { id: filename, lang: i18n.defaultLanguage }
  return {
    id: match[1],
    lang: match[2] || i18n.defaultLanguage,
  }
}

export function getAuthors(lang?: string): BlogAuthor[] {
  const language = lang || i18n.defaultLanguage
  return authors
    .filter((author) => getInfoFromPath(author.info.path).lang === language)
    .map((author) => ({
      id: getInfoFromPath(author.info.path).id,
      name: author.title,
      avatar: author.avatar,
      bio: author.bio,
      twitter: author.twitter,
      github: author.github,
      website: author.website,
    }))
}

export function getAuthor(id: string, lang?: string): BlogAuthor | null {
  const language = lang || i18n.defaultLanguage
  const author = authors.find(
    (a) => getInfoFromPath(a.info.path).id === id && getInfoFromPath(a.info.path).lang === language
  )
  if (!author) return null
  return {
    id: getInfoFromPath(author.info.path).id,
    name: author.title,
    avatar: author.avatar,
    bio: author.bio,
    twitter: author.twitter,
    github: author.github,
    website: author.website,
  }
}

export function getCategories(lang?: string): BlogCategory[] {
  const language = lang || i18n.defaultLanguage
  return categories
    .filter((category) => getInfoFromPath(category.info.path).lang === language)
    .map((category) => ({
      id: getInfoFromPath(category.info.path).id,
      name: category.title,
      description: category.description,
      slug: category.slug,
    }))
}

export function getCategory(slug: string, lang?: string): BlogCategory | null {
  const language = lang || i18n.defaultLanguage
  const category = categories.find(
    (c) => c.slug === slug && getInfoFromPath(c.info.path).lang === language
  )
  if (!category) return null
  return {
    id: getInfoFromPath(category.info.path).id,
    name: category.title,
    description: category.description,
    slug: category.slug,
  }
}

export function getBlogPosts(lang?: string) {
  const language = lang || i18n.defaultLanguage
  const pages = blogSource.getPages(language)
  return pages
    .filter((page) => (page.data as BlogFrontmatter).published !== false)
    .sort(
      (a, b) =>
        new Date((b.data as BlogFrontmatter).date).getTime() -
        new Date((a.data as BlogFrontmatter).date).getTime()
    )
}

export function getBlogPostsByCategory(categorySlug: string, lang?: string) {
  return getBlogPosts(lang).filter((post) =>
    (post.data as BlogFrontmatter).categories.includes(categorySlug)
  )
}

export function getBlogPostsByAuthor(authorId: string, lang?: string) {
  return getBlogPosts(lang).filter((post) => (post.data as BlogFrontmatter).author === authorId)
}

export function getBlogPost(slug: string[], lang?: string) {
  const language = lang || i18n.defaultLanguage
  return blogSource.getPage(slug, language)
}

export function mapToBlogPost(post: ReturnType<typeof blogSource.getPages>[number]): BlogPost {
  const data = post.data as BlogFrontmatter
  return {
    slug: post.slugs.join("/"),
    url: post.url,
    title: data.title,
    description: data.description,
    image: data.image,
    date: data.date.toISOString(),
    categories: data.categories,
    author: data.author,
    tags: data.tags,
  }
}
