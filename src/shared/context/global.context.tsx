import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react"
import { getConfigFn, getUserInfoFn } from "@/actions/global"
import type { PublicConfig } from "@/config/schema"
import type { UserInfo } from "@/shared/types/user"

type GlobalContextType = {
  config: PublicConfig | null
  userInfo: UserInfo | null
  isLoadingConfig: boolean
  isLoadingUserInfo: boolean
  refreshConfig: () => Promise<void>
  refreshUserInfo: () => Promise<void>
  clearUserInfo: () => void
}

const GlobalContext = createContext<GlobalContextType | null>(null)

export const useGlobalContext = () => {
  const context = useContext(GlobalContext)
  if (!context) {
    throw new Error("useGlobalContext must be used within GlobalContextProvider")
  }
  return context
}

export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()

  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["config"],
    queryFn: () => getConfigFn(),
  })

  const { data: userInfo, isLoading: isLoadingUserInfo } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfoFn(),
    staleTime: 5 * 60 * 1000,
  })

  const refreshConfig = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["config"] })
  }, [queryClient])
  const refreshUserInfo = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["userInfo"] })
  }, [queryClient])

  const clearUserInfo = useCallback(() => {
    queryClient.setQueryData(["userInfo"], null)
  }, [queryClient])

  const value = useMemo(
    () => ({
      config: config ?? null,
      userInfo: userInfo ?? null,
      isLoadingConfig,
      isLoadingUserInfo,
      refreshConfig,
      refreshUserInfo,
      clearUserInfo,
    }),
    [
      config,
      userInfo,
      isLoadingConfig,
      isLoadingUserInfo,
      refreshConfig,
      refreshUserInfo,
      clearUserInfo,
    ]
  )

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
}
