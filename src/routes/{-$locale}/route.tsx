import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeader } from "@tanstack/react-start/server"
import { getCookie, getPathWithoutLocale, getPrefix, Locales, validatePrefix } from "intlayer"
import { IntlayerProvider, useLocale } from "react-intlayer"
import { GlobalNotFoundComponent } from "@/shared/components/landing/not-found/index"
import { setLocaleCookie } from "@/shared/lib/locale/locale-cookie"

const LOCALE_STORAGE_KEY = "INTLAYER_LOCALE"
const DEFAULT_LOCALE = Locales.ENGLISH
const SUPPORTED_LOCALES = [Locales.ENGLISH, Locales.CHINESE] as const

function hasLocalePrefix(pathname: string): boolean {
  const firstSegment = pathname.split("/").filter(Boolean)[0]
  return Boolean(
    firstSegment &&
      SUPPORTED_LOCALES.includes(firstSegment as (typeof SUPPORTED_LOCALES)[number]) &&
      firstSegment !== DEFAULT_LOCALE
  )
}

const getServerLocaleRedirectHref = createServerFn({
  method: "GET",
})
  .inputValidator((input: { pathname: string; href: string }) => input)
  .handler(({ data }) => {
    if (hasLocalePrefix(data.pathname)) {
      return null
    }

    const cookieString = getRequestHeader("cookie") ?? ""
    const storedLocale = getCookie(LOCALE_STORAGE_KEY, cookieString)

    if (
      !storedLocale ||
      !SUPPORTED_LOCALES.includes(storedLocale as (typeof SUPPORTED_LOCALES)[number]) ||
      storedLocale === DEFAULT_LOCALE
    ) {
      return null
    }

    const { localePrefix } = getPrefix(storedLocale)
    const newPath = data.pathname === "/" ? `/${localePrefix}` : `/${localePrefix}${data.pathname}`
    const search = new URL(data.href, "http://localhost").search

    return newPath + search
  })

export const Route = createFileRoute("/{-$locale}")({
  beforeLoad: async ({ params, location }) => {
    const localeParam = params.locale
    const { isValid, localePrefix } = validatePrefix(localeParam)

    if (!isValid) {
      throw redirect({
        to: "/{-$locale}/404",
        params: { locale: localePrefix },
      })
    }

    if (typeof window === "undefined") {
      const serverRedirectHref = await getServerLocaleRedirectHref({
        data: {
          pathname: location.pathname,
          href: location.href,
        },
      })

      if (serverRedirectHref) {
        throw redirect({ href: serverRedirectHref, replace: true })
      }
    }

    if (typeof window !== "undefined") {
      const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
      const urlLocale = localeParam || Locales.ENGLISH

      if (storedLocale && urlLocale !== storedLocale) {
        if (!localeParam) {
          const { localePrefix: storedPrefix } = getPrefix(storedLocale)
          const pathWithoutLocale = getPathWithoutLocale(location.pathname)
          const localizedPath =
            pathWithoutLocale === "/" ? `/${storedPrefix}` : `/${storedPrefix}${pathWithoutLocale}`

          throw redirect({
            href: localizedPath + window.location.search,
            replace: true,
          })
        } else {
          localStorage.setItem(LOCALE_STORAGE_KEY, urlLocale)
          setLocaleCookie(urlLocale)
        }
      }
    }
  },
  component: LayoutComponent,
  notFoundComponent: NotFoundLayout,
})

function LayoutComponent() {
  const { defaultLocale } = useLocale()
  const { locale } = Route.useParams()

  return (
    <IntlayerProvider locale={locale ?? defaultLocale}>
      <Outlet />
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
