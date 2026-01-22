import { useRouterState } from "@tanstack/react-router"
import { Cog, Coins, Package, Users } from "lucide-react"
import { useIntlayer } from "react-intlayer"
import logo from "@/logo.svg"
import { LocalizedLink, type To } from "@/shared/components/locale/localized-link"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/components/ui/sidebar"

export default function AdminSidebar() {
  const content = useIntlayer("admin")
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const navItems: { title: string; url: To; icon: typeof Users; match: string }[] = [
    {
      title: String(content.sidebar.users.value),
      url: "/admin/users",
      icon: Users,
      match: "/admin/users",
    },
    {
      title: String(content.sidebar.products.value),
      url: "/admin/products",
      icon: Package,
      match: "/admin/products",
    },
    {
      title: String(content.sidebar.creditPackages.value),
      url: "/admin/credit-packages",
      icon: Coins,
      match: "/admin/credit-packages",
    },
    {
      title: String(content.sidebar.config.value),
      url: "/admin/config",
      icon: Cog,
      match: "/admin/config",
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
            >
              <LocalizedLink to="/">
                <div className="flex items-center justify-center w-7 h-7 p-0.5 bg-black/90 rounded-md">
                  <img
                    src={logo}
                    alt="Logo"
                    className="size-8 invert dark:invert-0"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[state=collapsed]:hidden">
                  <span className="truncate font-semibold">{content.title}</span>
                </div>
              </LocalizedLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = currentPath.includes(item.match)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <LocalizedLink to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </LocalizedLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
