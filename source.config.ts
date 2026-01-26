import { defineCollections, defineDocs, frontmatterSchema } from "fumadocs-mdx/config"
import { z } from "zod"

export const docs = defineDocs({
  dir: "content/docs",
})

export const blog = defineCollections({
  type: "doc",
  dir: "content/blog",
  schema: frontmatterSchema.extend({
    image: z.string().optional(),
    date: z.coerce.date(),
    published: z.boolean().default(true),
    categories: z.array(z.string()).default([]),
    author: z.string(),
    tags: z.array(z.string()).default([]),
  }),
})

export const authors = defineCollections({
  type: "doc",
  dir: "content/authors",
  schema: frontmatterSchema.extend({
    avatar: z.string().optional(),
    bio: z.string().optional(),
    twitter: z.string().optional(),
    github: z.string().optional(),
    website: z.string().optional(),
  }),
})

export const categories = defineCollections({
  type: "doc",
  dir: "content/categories",
  schema: frontmatterSchema.extend({
    slug: z.string(),
  }),
})

const roadmapItemSchema = z.object({
  title: z.string(),
})

const roadmapColumnSchema = z.object({
  title: z.string(),
  icon: z.string().regex(/^[A-Za-z]+$/),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/),
  items: z.array(roadmapItemSchema).default([]),
})

export const roadmap = defineCollections({
  type: "meta",
  dir: "content/roadmap",
  schema: z.object({
    columns: z.array(roadmapColumnSchema).default([]),
  }),
})
