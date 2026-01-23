import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { validatePrefix } from "intlayer"
import { IntlayerProvider, useLocale } from "react-intlayer"
import { GlobalNotFoundComponent } from "@/shared/components/landing/not-found"
import { GlobalContextProvider } from "@/shared/context/global.context"

export const Route = createFileRoute("/{-$locale}")({
  beforeLoad: ({ params }) => {
    const localeParam = params.locale
    const { isValid, localePrefix } = validatePrefix(localeParam)

    if (isValid) {
      return
    }

    throw redirect({
      to: "/{-$locale}/404",
      params: { locale: localePrefix },
    })
  },
  component: LayoutComponent,
  notFoundComponent: NotFoundLayout,
})

function LayoutComponent() {
  const { defaultLocale } = useLocale()
  const { locale } = Route.useParams()

  return (
    <IntlayerProvider locale={locale ?? defaultLocale}>
      <GlobalContextProvider>
        <Outlet />
      </GlobalContextProvider>
    </IntlayerProvider>
  )
}

function NotFoundLayout() {
  const { defaultLocale } = useLocale()
  const { locale } = Route.useParams()

  return (
    <IntlayerProvider locale={locale ?? defaultLocale}>
      <GlobalNotFoundComponent />
    </IntlayerProvider>
  )
}
