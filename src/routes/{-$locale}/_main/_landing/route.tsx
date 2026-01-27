import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router"
import Banner from "@/shared/components/landing/banner"
import { Footer } from "@/shared/components/landing/footer"
import { LandingHeader } from "@/shared/components/landing/header"

export const Route = createFileRoute("/{-$locale}/_main/_landing")({
  component: RouteComponent,
})

function RouteComponent() {
  const matches = useMatches()
  const currentMatch = matches[matches.length - 1]
  const staticData = currentMatch?.staticData as { hideHeader?: boolean } | undefined
  const hideHeader = staticData?.hideHeader

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      {!hideHeader && <Banner />}
      {!hideHeader && <LandingHeader />}
      <main>
        <Outlet />
        {!hideHeader && <Footer />}
      </main>
    </div>
  )
}
