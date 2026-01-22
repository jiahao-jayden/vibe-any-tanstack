import { useLocation } from "@tanstack/react-router"
import { getLocaleName, getPathWithoutLocale, getPrefix } from "intlayer"
import { Globe } from "lucide-react"
import { useLocale } from "react-intlayer"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { cn } from "@/shared/lib/utils"
import { LocalizedLink, type To } from "./localized-link"

export const LocaleSwitcher = () => {
  const { pathname } = useLocation()
  const { availableLocales, locale, setLocale } = useLocale()
  const pathWithoutLocale = getPathWithoutLocale(pathname)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 select-none cursor-pointer"
          aria-label="Switch language"
        >
          <Globe className="size-4" />
          <span className="hidden sm:inline">{getLocaleName(locale)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-35"
      >
        {availableLocales.map((localeEl) => (
          <DropdownMenuItem
            key={localeEl}
            asChild
            className="cursor-pointer"
          >
            <LocalizedLink
              onClick={() => setLocale(localeEl)}
              params={{ locale: getPrefix(localeEl).localePrefix }}
              to={pathWithoutLocale as To}
              className={cn("w-full", locale === localeEl && "bg-muted")}
            >
              {getLocaleName(localeEl)}
            </LocalizedLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
