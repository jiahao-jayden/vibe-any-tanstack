import { LogOutIcon, RefreshCwIcon, SparklesIcon, UserPenIcon } from "lucide-react"
import { useState } from "react"
import { useIntlayer } from "react-intlayer"
import { PricingDialog } from "@/shared/components/landing/pricing/pricing-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import { useGlobalContext } from "@/shared/context/global.context"
import { signOut } from "@/shared/lib/auth/auth-client"

export function AccountPanel() {
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const { userInfo } = useGlobalContext()

  const user = userInfo?.user
  if (!user) return null

  const planName = userInfo?.payment?.activePlan?.id ?? "free"

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-14 md:size-16">
          <AvatarImage
            src={user.image ?? undefined}
            alt={user.name ?? "User"}
          />
          <AvatarFallback className="text-lg md:text-xl bg-amber-400 text-white">
            {initials || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base md:text-lg truncate">{user.name}</div>
          <div className="text-muted-foreground text-sm truncate">{user.email}</div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Edit profile"
          >
            <UserPenIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Sign out"
            className="text-destructive/60 hover:text-destructive"
            onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })}
          >
            <LogOutIcon className="size-4" />
          </Button>
        </div>
      </div>

      <CreditDetail
        planName={planName}
        onUpgradeClick={() => setIsPricingOpen(true)}
      />

      <PricingDialog
        open={isPricingOpen}
        onOpenChange={setIsPricingOpen}
      />
    </div>
  )
}

interface CreditDetailProps {
  planName: string
  onUpgradeClick: () => void
}

export function CreditDetail({ planName, onUpgradeClick }: CreditDetailProps) {
  const { config, userInfo } = useGlobalContext()
  const { credits: t } = useIntlayer("user-dashboard")
  const creditEnabled = config?.public_credit_enable
  const dailyEnabled = config?.public_credit_daily_enabled
  const dailyAmount = config?.public_credit_daily_amount ?? 0
  const userCredits = userInfo?.credits?.userCredits ?? 0
  const dailyBonusCredits = userInfo?.credits?.dailyBonusCredits ?? 0
  const nextRefreshTime = userInfo?.credits?.nextRefreshTime
  const totalCredits = userCredits + dailyBonusCredits

  const formatNextRefreshTime = (isoString: string | null | undefined): string => {
    if (!isoString) return ""
    const date = new Date(isoString)
    const now = new Date()
    if (date <= now) return ""
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!creditEnabled) return null

  const formattedRefreshTime = formatNextRefreshTime(nextRefreshTime)

  return (
    <div className="rounded-lg bg-muted/50 p-4 space-y-4 border">
      <div className="flex items-center justify-between">
        <span className="font-medium capitalize">{planName}</span>
        <Button
          size="sm"
          onClick={onUpgradeClick}
        >
          {t.upgrade.value}
        </Button>
      </div>

      <Separator className="border-dashed" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <SparklesIcon className="size-4" />
            <span>{t.totalCredits.value}</span>
          </div>
          <span className="font-medium">{totalCredits}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground text-sm">
          <span className="pl-6">{t.purchasedCredits.value}</span>
          <span>{userCredits}</span>
        </div>
      </div>

      {dailyEnabled && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <RefreshCwIcon className="size-4" />
              <span>{t.dailyBonus.value}</span>
            </div>
            <span className="font-medium">{dailyBonusCredits}</span>
          </div>
          <div className="text-muted-foreground text-xs space-y-0.5">
            <div>{t.dailyAmount.value.replace("{amount}", String(dailyAmount))}</div>
            {formattedRefreshTime && (
              <div>{t.dailyRefreshAt.value.replace("{time}", formattedRefreshTime)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
