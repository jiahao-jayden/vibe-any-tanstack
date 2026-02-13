import { Image } from "@unpic/react"
import { Accordion, Accordions } from "fumadocs-ui/components/accordion"
import { Callout } from "fumadocs-ui/components/callout"
import { File, Files, Folder } from "fumadocs-ui/components/files"
import { ImageZoom } from "fumadocs-ui/components/image-zoom"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { TypeTable } from "fumadocs-ui/components/type-table"
import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"
import type { ComponentProps, FC, ReactNode } from "react"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const Tag = `h${level}` as const
  return function Heading({ children, ...props }: { children?: ReactNode }) {
    const text = typeof children === "string" ? children : children?.toString() || ""
    const id = slugify(text)
    return (
      <Tag
        id={id}
        {...props}
      >
        {children}
      </Tag>
    )
  }
}

export function getBlogMDXComponents(customComponents: MDXComponents = {}): MDXComponents {
  return {
    ...defaultMdxComponents,
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    h5: createHeading(5),
    h6: createHeading(6),
    Tabs,
    Tab,
    TypeTable,
    Accordion,
    Accordions,
    Steps,
    Step,
    File,
    Folder,
    Files,
    blockquote: Callout as unknown as FC<ComponentProps<"blockquote">>,
    img: (props: ComponentProps<"img">) => {
      if (!props.src) return null
      return (
        <ImageZoom>
          <Image
            src={props.src}
            alt={props.alt || ""}
            layout="fullWidth"
            className="rounded-lg"
          />
        </ImageZoom>
      )
    },
    ...customComponents,
  }
}
