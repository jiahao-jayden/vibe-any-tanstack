import { useLocation, useRouterState } from "@tanstack/react-router"
import { getLocaleName, getPathWithoutLocale, getPrefix } from "intlayer"
import {
  BrainCircuit,
  Check,
  ChevronsUpDown,
  Cog,
  Coins,
  Home,
  Languages,
  LogOut,
  ReceiptIcon,
  Users,
} from "lucide-react"
import { useIntlayer, useLocale } from "react-intlayer"
import { siteConfig } from "@/config/site-config"
import { LocalizedLink, type To } from "@/shared/components/locale/localized-link"
import { AnimatedThemeToggler } from "@/shared/components/ui/animated-theme-toggler"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/shared/components/ui/sidebar"
import { useGlobalContext } from "@/shared/context/global.context"
import { signOut } from "@/shared/lib/auth/auth-client"
import { setLocaleCookie } from "@/shared/lib/locale/locale-cookie"
import { cn } from "@/shared/lib/utils"

function getInitials(name: string | undefined | null) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function AdminSidebar() {
  const content = useIntlayer("admin")
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const { userInfo } = useGlobalContext()
  const { pathname } = useLocation()
  const { availableLocales, locale, setLocale } = useLocale()
  const pathWithoutLocale = getPathWithoutLocale(pathname)

  const mainNavItems: { title: string; url: To; icon: typeof Users; match: string }[] = [
    {
      title: String(content.sidebar.users.value),
      url: "/admin/users",
      icon: Users,
      match: "/admin/users",
    },
    {
      title: String(content.sidebar.orders.value),
      url: "/admin/orders",
      icon: ReceiptIcon,
      match: "/admin/orders",
    },
    {
      title: String(content.sidebar.creditPackages.value),
      url: "/admin/credit-packages",
      icon: Coins,
      match: "/admin/credit-packages",
    },
  ]

  const isConfigActive =
    currentPath.includes("/admin/config") && !currentPath.includes("/admin/ai-config")
  const isAIConfigActive = currentPath.includes("/admin/ai-config")

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
            >
              <LocalizedLink to="/admin/users">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <img
                    src="/logo.svg"
                    alt="Logo"
                    className="size-5 invert dark:invert-0"
                  />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{content.title}</span>
                  <span className="truncate text-xs text-muted-foreground">Vibe Any</span>
                </div>
              </LocalizedLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{content.sidebar.management}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = currentPath.includes(item.match)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        isActive && "border",
                        !isActive && "hover:border-border text-primary/80"
                      )}
                    >
                      <LocalizedLink to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </LocalizedLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        <SidebarGroup>
          <SidebarGroupLabel>{content.sidebar.system}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isAIConfigActive}
                  tooltip={String(content.sidebar.aiConfig.value)}
                  className={cn(
                    isAIConfigActive && "border",
                    !isAIConfigActive && "hover:border-border text-primary/80"
                  )}
                >
                  <LocalizedLink to="/admin/ai-config">
                    <BrainCircuit className="size-4" />
                    <span>{content.sidebar.aiConfig}</span>
                  </LocalizedLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isConfigActive}
                  tooltip={String(content.sidebar.config.value)}
                  className={cn(
                    isConfigActive && "border",
                    !isConfigActive && "hover:border-border text-primary/80"
                  )}
                >
                  <LocalizedLink to="/admin/config">
                    <Cog className="size-4" />
                    <span>{content.sidebar.config}</span>
                  </LocalizedLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex min-w-0 items-center gap-1 overflow-hidden px-1 group-data-[collapsible=icon]:justify-center">
              <LocalizedLink
                to="/"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                aria-label="Home"
              >
                <Home className="size-4" />
              </LocalizedLink>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                    aria-label="Switch language"
                  >
                    <Languages className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="min-w-36"
                >
                  {availableLocales.map((localeEl) => (
                    <DropdownMenuItem
                      key={localeEl}
                      asChild
                      className="cursor-pointer"
                    >
                      <LocalizedLink
                        onClick={() => {
                          setLocale(localeEl)
                          setLocaleCookie(localeEl)
                        }}
                        params={{ locale: getPrefix(localeEl).localePrefix }}
                        to={pathWithoutLocale as To}
                      >
                        <span>{getLocaleName(localeEl)}</span>
                        {locale === localeEl && <Check className="ml-auto size-4" />}
                      </LocalizedLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {siteConfig.theme.enableSwitch && (
                <AnimatedThemeToggler className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground" />
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>

        {userInfo?.user && (
          <>
            <SidebarSeparator className="mx-0" />
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent"
                      tooltip={userInfo.user.name ?? "User"}
                    >
                      <Avatar className="size-8 rounded-lg">
                        <AvatarImage
                          src={userInfo.user.image ?? undefined}
                          alt={userInfo.user.name ?? ""}
                          cache
                        />
                        <AvatarFallback className="rounded-lg text-xs">
                          {getInitials(userInfo.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{userInfo.user.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {userInfo.user.email}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="start"
                    sideOffset={8}
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                  >
                    <div className="flex items-center gap-3 px-2 py-2">
                      <Avatar className="size-10 rounded-lg">
                        <AvatarImage
                          src={userInfo.user.image ?? undefined}
                          alt={userInfo.user.name ?? ""}
                          cache
                        />
                        <AvatarFallback className="rounded-lg">
                          {getInitials(userInfo.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left leading-tight">
                        <span className="font-medium">{userInfo.user.name}</span>
                        <span className="text-xs text-muted-foreground">{userInfo.user.email}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })
                      }
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="size-4" />
                      <span>{content.sidebar.logout}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
