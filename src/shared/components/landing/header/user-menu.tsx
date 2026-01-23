import { CreditCardIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react"
import { useState } from "react"
import { useIntlayer } from "react-intlayer"
import { LocalizedLink, type To } from "@/shared/components/locale/localized-link"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { UserDashboard } from "@/shared/components/user-dashboard"
import { useGlobalContext } from "@/shared/context/global.context"
import { signOut } from "@/shared/lib/auth/auth-client"

function getInitials(name: string | undefined | null) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function UserMenu() {
  const { userMenu } = useIntlayer("auth")
  const { userInfo, isLoadingUserInfo } = useGlobalContext()
  const [isOpenUserDashboard, setIsOpenUserDashboard] = useState(false)

  if (isLoadingUserInfo) {
    return <Skeleton className="size-9 rounded-full" />
  }

  if (!userInfo?.user) {
    return (
      <Button
        asChild
        size="sm"
      >
        <LocalizedLink to="/login">{userMenu.login.value}</LocalizedLink>
      </Button>
    )
  }

  const { user } = userInfo

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Avatar className="size-8">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? userMenu.avatarAlt.value}
              />
              <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-72"
          align="end"
        >
          <DropdownMenuLabel className="flex items-center gap-3 px-3 py-2 font-normal">
            <Avatar className="size-10">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? userMenu.avatarAlt.value}
              />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col items-start overflow-hidden">
              <span className="text-foreground font-medium truncate w-full">{user.name}</span>
              <span className="text-muted-foreground text-sm truncate w-full">{user.email}</span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <LocalizedLink
                to={"/profile" as To}
                className="cursor-pointer"
              >
                <UserIcon className="size-4" />
                <span>{userMenu.profile.value}</span>
              </LocalizedLink>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsOpenUserDashboard(true)}
              className="cursor-pointer"
            >
              <SettingsIcon className="size-4" />
              <span>{userMenu.settings.value}</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <LocalizedLink
                to={"/billing" as To}
                className="cursor-pointer"
              >
                <CreditCardIcon className="size-4" />
                <span>{userMenu.billing.value}</span>
              </LocalizedLink>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })}
            className="cursor-pointer"
          >
            <LogOutIcon className="size-4" />
            <span>{userMenu.logout.value}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserDashboard
        open={isOpenUserDashboard}
        onOpenChange={setIsOpenUserDashboard}
      />
    </>
  )
}
