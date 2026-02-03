import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router"
import { useIntlayer } from "react-intlayer"
import Banner from "@/shared/components/landing/banner"
import { Footer } from "@/shared/components/landing/footer"
import { LandingHeader } from "@/shared/components/landing/header"

export const Route = createFileRoute("/{-$locale}/_main/_landing")({
  component: RouteComponent,
  ssr: true,
})

function RouteComponent() {
  const { banner, header, footer } = useIntlayer("landing")
  const matches = useMatches()
  const currentMatch = matches[matches.length - 1]
  const staticData = currentMatch?.staticData as { hideHeader?: boolean } | undefined
  const hideHeader = staticData?.hideHeader

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      {!hideHeader && banner.display && <Banner />}
      {!hideHeader && header.display && <LandingHeader />}
      <main>
        <Outlet />
        {!hideHeader && footer.display && <Footer />}
      </main>
    </div>
  )
}
