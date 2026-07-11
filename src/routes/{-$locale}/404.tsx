import { createFileRoute } from "@tanstack/react-router"
import { GlobalNotFoundComponent } from "@/shared/components/landing/not-found/index"

export const Route = createFileRoute("/{-$locale}/404")({
  component: GlobalNotFoundComponent,
})
