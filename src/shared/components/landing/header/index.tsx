"use client"

import { useLocation } from "@tanstack/react-router"
import { MenuIcon } from "lucide-react"
import { useIntlayer } from "react-intlayer"
import { siteConfig } from "@/config/site-config"
import { LocaleSwitcher } from "@/shared/components/locale/locale-switcher"
import { LocalizedLink } from "@/shared/components/locale/localized-link"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/shared/components/ui/navigation-menu"
import { cn } from "@/shared/lib/utils"
import { ThemeSwitcher } from "./theme-switcher"
import { UserMenu } from "./user-menu"

export const LandingHeader = () => {
  const { header } = useIntlayer("landing")
  const location = useLocation()
  const { title, images } = siteConfig

  const items = header.items.map((item, index) => ({
    id: `${index}`,
    label: item.label.value,
    href: item.href.value,
  }))

  const isActivePath = (href: string) => {
    if (href === "/") return false
    return location.pathname.includes(href)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "bg-background/95 backdrop-blur-md",
        "supports-backdrop-filter:bg-background/90",
        "border-b"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <LocalizedLink
          className="flex items-center gap-1"
          to="/"
          aria-label="Go to homepage"
        >
          {images.logo && (
            <img
              src={images.logo}
              alt={title ?? ""}
              width={32}
              height={32}
              className={cn("size-8", images.isInvert && "dark:invert")}
            />
          )}
          <span className="text-xl font-bold text-primary select-none">{title}</span>
        </LocalizedLink>

        <NavigationMenu
          viewport={false}
          className="max-md:hidden"
        >
          <NavigationMenuList className="gap-1">
            {items.map((item) => (
              <NavigationMenuItem key={item.id}>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <LocalizedLink
                    to={item.href}
                    className={cn(isActivePath(item.href) && "text-primary bg-muted/50")}
                  >
                    {item.label}
                  </LocalizedLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          <LocaleSwitcher />
          <UserMenu />

          <DropdownMenu>
            <DropdownMenuTrigger
              className="md:hidden"
              asChild
            >
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
              >
                <MenuIcon className="size-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48"
              align="end"
            >
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  asChild
                >
                  <LocalizedLink
                    to={item.href}
                    className={cn(
                      "w-full cursor-pointer",
                      isActivePath(item.href) && "text-primary"
                    )}
                  >
                    {item.label}
                  </LocalizedLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
