import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import mdx from "fumadocs-mdx/vite"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import { intlayer, intlayerProxy } from "vite-intlayer"
import viteTsConfigPaths from "vite-tsconfig-paths"
import * as MdxConfig from "./source.config"

const config = defineConfig({
  plugins: [
    intlayerProxy(), // must be placed before nitro
    devtools(),
    nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    intlayer(),
    mdx(MdxConfig),
  ],
})

export default config
