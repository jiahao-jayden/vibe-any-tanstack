import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HttpError } from "@/shared/lib/tools/http-client"

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof HttpError && error.code === 401) return false
          return failureCount < 2
        },
      },
    },
  })
  return {
    queryClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
