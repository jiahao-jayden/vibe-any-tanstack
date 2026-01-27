// 如果是生产环境，禁止访问
import { createMiddleware } from "@tanstack/react-start"

export const blockMiddleware = createMiddleware().server(async ({ next }) => {
  if (import.meta.env.VITE_ENV === "production") {
    console.log(12311)
  }

  return await next()
})
