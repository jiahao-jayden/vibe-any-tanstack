"use client"

import { useLocation } from "@tanstack/react-router"
import { MenuIcon } from "lucide-react"
import { useIntlayer } from "react-intlayer"
import { siteConfig } from "@/config/site-config"
import { LocaleSwitcher } from "@/shared/components/locale/locale-switcher"
import { LocalizedLink, type To } from "@/shared/components/locale/localized-link"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/shared/components/ui/navigation-menu"
import { cn } from "@/shared/lib/utils"
import { ThemeSwitcher } from "./theme-switcher"
import { UserMenu } from "./user-menu"

interface MenuItem {
  id: string
  label: string
  href?: To | string
  children?: MenuItem[]
}

export const LandingHeader = () => {
  const { header } = useIntlayer("landing")
  const location = useLocation()
  const { title, images } = siteConfig

  const items: MenuItem[] = header.items.map((item, index) => {
    const children =
      "children" in item && Array.isArray(item.children)
        ? item.children.map(
            (child: { label: { value: string }; href: { value: string } }, childIndex: number) => ({
              id: `${index}-${childIndex}`,
              label: child.label.value,
              href: child.href.value as To,
            })
          )
        : undefined

    return {
      id: `${index}`,
      label: item.label.value,
      href: "href" in item ? (item.href.value as To) : undefined,
      children,
    }
  })

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
                {item.children ? (
                  <>
                    <NavigationMenuTrigger className="gap-1">{item.label}</NavigationMenuTrigger>
                    <NavigationMenuContent className="shadow-none!">
                      <ul className="grid w-48 gap-1">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <NavigationMenuLink asChild>
                              <LocalizedLink
                                to={child.href ?? "/"}
                                className={cn(
                                  "block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors",
                                  "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  child.href &&
                                    isActivePath(child.href) &&
                                    "text-primary bg-muted/50"
                                )}
                              >
                                {child.label}
                              </LocalizedLink>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <LocalizedLink
                      to={item.href ?? "/"}
                      className={cn(
                        item.href && isActivePath(item.href) && "text-primary bg-muted/50"
                      )}
                    >
                      {item.label}
                    </LocalizedLink>
                  </NavigationMenuLink>
                )}
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
              {items.map((item) =>
                item.children ? (
                  <DropdownMenuSub key={item.id}>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      {item.label}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {item.children.map((child) => (
                        <DropdownMenuItem
                          key={child.id}
                          asChild
                        >
                          <LocalizedLink
                            to={child.href ?? "/"}
                            className={cn(
                              "w-full cursor-pointer",
                              child.href && isActivePath(child.href) && "text-primary"
                            )}
                          >
                            {child.label}
                          </LocalizedLink>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ) : (
                  <DropdownMenuItem
                    key={item.id}
                    asChild
                  >
                    <LocalizedLink
                      to={item.href ?? "/"}
                      className={cn(
                        "w-full cursor-pointer",
                        item.href && isActivePath(item.href) && "text-primary"
                      )}
                    >
                      {item.label}
                    </LocalizedLink>
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
