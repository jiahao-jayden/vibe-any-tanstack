import { createRequire } from "node:module"
import { cloudflare } from "@cloudflare/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import mdx from "fumadocs-mdx/vite"
import { nitro } from "nitro/vite"
import { defineConfig, type Plugin } from "vite"
import { intlayer, intlayerProxy } from "vite-intlayer"
import viteTsConfigPaths from "vite-tsconfig-paths"
import * as MdxConfig from "./source.config"

function tanstackServerHMR(): Plugin {
  return {
    name: "tanstack-server-hmr",
    enforce: "post",
    handleHotUpdate(ctx) {
      if (ctx.file.includes("/routes/api/") || ctx.file.includes("/integrations/")) {
        ctx.server.restart()
      }
    },
  }
}

const require = createRequire(import.meta.url)
const jsEnginePath = require.resolve("@shikijs/engine-javascript").replace(/\\/g, "/")

function ssrOnlyStubs(): Plugin {
  const noopFn = "() => {}"
  const stubs: Record<string, string> = {
    "beautiful-mermaid": [
      `export const THEMES = new Proxy({}, { get: () => ({}) });`,
      `export async function renderMermaid() { return ""; }`,
    ].join("\n"),
    "@streamdown/mermaid": `export const mermaid = {};`,
    "@streamdown/code": `export const code = {};`,
    "@streamdown/math": `export const math = {};`,
    "@streamdown/cjk": `export const cjk = {};`,
    shiki: [
      `export async function createHighlighter() { return { codeToHtml: ${noopFn}, loadLanguage: ${noopFn}, getLoadedLanguages: () => [] }; }`,
      `export async function codeToHtml() { return ""; }`,
      `export const bundledLanguages = {};`,
      `export const bundledThemes = {};`,
    ].join("\n"),
  }
  const stubPrefix = "\0ssr-stub:"
  return {
    name: "ssr-only-stubs",
    enforce: "pre",
    apply: "build",
    resolveId(source) {
      if (this.environment?.name !== "ssr") return
      if (source in stubs) return stubPrefix + source
    },
    load(id) {
      if (id.startsWith(stubPrefix)) {
        return stubs[id.slice(stubPrefix.length)]
      }
    },
  }
}

function shikiNoWasm(): Plugin {
  const engineShimId = "\0shiki-engine-js-shim"
  const wasmShimId = "\0shiki-wasm-noop"
  return {
    name: "shiki-no-wasm",
    enforce: "pre",
    resolveId(source) {
      if (source === "@shikijs/engine-oniguruma") return engineShimId
      if (source === "shiki/wasm" || source.startsWith("@shikijs/engine-oniguruma/wasm"))
        return wasmShimId
    },
    load(id) {
      if (id === engineShimId) {
        return [
          `import { createJavaScriptRegexEngine } from "${jsEnginePath}";`,
          `export function createOnigurumaEngine() { return createJavaScriptRegexEngine(); }`,
          `export function loadWasm() {}`,
          `export function setDefaultWasmLoader() {}`,
          `export function getDefaultWasmLoader() { return undefined; }`,
        ].join("\n")
      }
      if (id === wasmShimId) {
        return `export default undefined;`
      }
    },
  }
}

const config = defineConfig({
  build: {
    rollupOptions: {
      external: ["cloudflare:sockets"],
    },
  },
  optimizeDeps: {
    include: [
      "dotenv",
      "@radix-ui/react-tabs",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-popover",
    ],
  },
  plugins: [
    ssrOnlyStubs(),
    shikiNoWasm(),
    ...(process.env.CF_PAGES || process.argv.includes("build")
      ? [cloudflare({ viteEnvironment: { name: "ssr" } })]
      : []),
    intlayerProxy(
      {},
      {
        ignore: (req) => req.url?.startsWith("/api/") ?? false,
      }
    ),
    devtools(),
    nitro(),
    tanstackServerHMR(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: false,
      },
      sitemap: {
        enabled: false,
      },
    }),
    viteReact(),
    intlayer(),
    mdx(MdxConfig),
  ],
})

export default config
