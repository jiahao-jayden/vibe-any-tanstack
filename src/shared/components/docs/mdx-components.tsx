import { Accordion, Accordions } from "fumadocs-ui/components/accordion"
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock"
import { File, Files, Folder } from "fumadocs-ui/components/files"
import { ImageZoom } from "fumadocs-ui/components/image-zoom"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { TypeTable } from "fumadocs-ui/components/type-table"
import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"
import { CommandTab } from "./command-tab"
import { GridItem } from "./grid-item"
import { SecretGenerator } from "./secret-generator"
import { TechStack } from "./tech-stack"

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // Custom Image Component
    img: (props) => (
      <ImageZoom
        className="rounded-md"
        {...(props as any)}
      />
    ),
    pre: ({ ref: _ref, ...props }) => (
      <CodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    CommandTab: (props) => {
      return <CommandTab {...props} />
    },
    GridItem: (props) => {
      return <GridItem {...props} />
    },
    TechStack: (props) => {
      return <TechStack {...props} />
    },
    SecretGenerator: () => {
      return <SecretGenerator />
    },
    Tab,
    Tabs,
    Step,
    Steps,
    Accordion,
    Accordions,
    File,
    Files,
    Folder,
    TypeTable,
    ...components,
  }
}
