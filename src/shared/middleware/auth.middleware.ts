import { redirect } from "@tanstack/react-router"
import { createMiddleware } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "@/shared/lib/auth/auth-server"
import { isUserAdmin } from "@/shared/model/rabc.model"

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session) {
    throw redirect({ to: "/{-$locale}/login" })
  }

  return await next()
})

export const adminMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session) {
    throw redirect({ to: "/{-$locale}/login" })
  }

  const isAdmin = await isUserAdmin(session.user.id)
  if (!isAdmin) {
    throw redirect({ to: "/{-$locale}/404" })
  }

  return await next()
})
