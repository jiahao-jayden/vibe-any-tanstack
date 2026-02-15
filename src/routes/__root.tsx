import { TanStackDevtools } from "@tanstack/react-devtools"
import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { NuqsAdapter } from "nuqs/adapters/tanstack-router"
import { ThemeProvider } from "tanstack-theme-kit"
import { siteConfig } from "@/config/site-config"
import appCss from "@/config/style/global.css?url"
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools"
import { ErrorToaster } from "@/shared/components/error-toaster"
import { Toaster } from "@/shared/components/ui/sonner"
import { getIsAuthEnabled } from "@/shared/lib/auth/auth-config"

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  loader: async () => ({
    isAuthEnabled: await getIsAuthEnabled(),
  }),
  head: ({ matches }) => {
    const pathname = matches[matches.length - 1]?.pathname ?? "/"
    const baseUrl = import.meta.env.VITE_APP_URL ?? ""
    const canonical = pathname === "/" ? baseUrl || "/" : `${baseUrl}${pathname}`

    return {
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          title: siteConfig.title,
        },
        {
          name: "description",
          content: siteConfig.description,
        },
        ...(siteConfig.robots?.meta ? [{ name: "robots", content: siteConfig.robots.meta }] : []),
        ...(siteConfig.keywords?.length
          ? [
              {
                name: "keywords",
                content: siteConfig.keywords.join(", "),
              },
            ]
          : []),
        // Open Graph
        {
          property: "og:title",
          content: siteConfig.title,
        },
        {
          property: "og:description",
          content: siteConfig.description,
        },
        {
          property: "og:image",
          content: `${import.meta.env.VITE_APP_URL}${siteConfig.images.ogImage}`,
        },
        ...(baseUrl ? [{ property: "og:url", content: canonical }] : []),
        {
          property: "og:type",
          content: "website",
        },
        // Twitter Card
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:title",
          content: siteConfig.title,
        },
        {
          name: "twitter:description",
          content: siteConfig.description,
        },
        {
          name: "twitter:image",
          content: `${import.meta.env.VITE_APP_URL}${siteConfig.images.ogImage}`,
        },
        ...(baseUrl ? [{ name: "twitter:url", content: canonical }] : []),
      ],
      links: [
        ...(baseUrl ? [{ rel: "canonical", href: canonical }] : []),
        {
          rel: "stylesheet",
          href: appCss,
        },
      ],
    }
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
        {import.meta.env.VITE_GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${import.meta.env.VITE_GA_MEASUREMENT_ID}');`,
              }}
            />
          </>
        )}
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme={siteConfig.theme.defaultTheme}
          enableSystem
        >
          <NuqsAdapter>
            <Toaster />
            <ErrorToaster />
            {children}
          </NuqsAdapter>
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
