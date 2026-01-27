import { createFileRoute, Outlet } from "@tanstack/react-router"
import AdminSidebar from "@/shared/components/sidebar/admin-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/shared/components/ui/sidebar"
import { adminMiddleware, authMiddleware } from "@/shared/middleware/auth.middleware"

export const Route = createFileRoute("/{-$locale}/_main/admin")({
  component: RouteComponent,
  ssr: false,
  server: {
    middleware: [authMiddleware, adminMiddleware],
  },
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main
        className="flex min-h-dvh min-w-0 flex-1 flex-col"
        style={{ fontFamily: "Inter Variable" }}
      >
        <div className="flex items-center border-b p-2 md:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex-1 space-y-6 p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  )
}
