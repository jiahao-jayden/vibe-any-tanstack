import { useMutation, useQuery } from "@tanstack/react-query"
import { Coins, Loader2, Sparkles } from "lucide-react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { useGlobalContext } from "@/shared/context/global.context"
import { http } from "@/shared/lib/tools/http-client"
import type { CreditPackage } from "@/shared/types/payment"

interface InsufficientCreditsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requiredCredits?: number
}

export const InsufficientCreditsDialog = ({
  open,
  onOpenChange,
  requiredCredits,
}: InsufficientCreditsDialogProps) => {
  const content = useIntlayer("user-dashboard")
  const creditPackagesDict = useIntlayer("credit-packages")
  const { credits, config, userInfo } = useGlobalContext()

  const isFreeUser = !userInfo?.payment?.activePlan
  const allowFreePurchase = config?.public_credit_allow_free_user_purchase ?? false
  const canPurchase = allowFreePurchase || !isFreeUser

  const { data: packages } = useQuery({
    queryKey: ["credit-packages"],
    queryFn: () => http<CreditPackage[]>("/api/credit/packages"),
    enabled: open,
  })

  const { mutate: handlePurchase, isPending } = useMutation({
    mutationFn: async (packageId: string) => {
      const data = await http<{ checkoutUrl?: string }>("/api/payment/credit-checkout", {
        method: "POST",
        body: { packageId },
      })
      return data
    },
    onSuccess: (data) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    },
    onError: () => {
      toast.error("Failed to create checkout")
    },
  })

  const getPackageContent = (key: string) => {
    const dict = creditPackagesDict as Record<
      string,
      { name?: { value: string }; description?: { value: string } }
    >
    return dict[key]
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100)
  }

  const findRecommendedPackage = () => {
    if (!packages || !requiredCredits) return packages?.[0]
    const needed = requiredCredits - (credits?.userCredits ?? 0)
    return packages.find((pkg) => pkg.creditAmount >= needed) || packages[packages.length - 1]
  }

  const recommendedPkg = findRecommendedPackage()

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="size-5 text-amber-500" />
            {content.insufficientCredits.title}
          </DialogTitle>
          <DialogDescription>
            {requiredCredits
              ? String(content.insufficientCredits.description.value)
                  .replace("{required}", String(requiredCredits))
                  .replace("{current}", String(credits?.userCredits ?? 0))
              : String(content.insufficientCredits.currentBalance.value).replace(
                  "{credits}",
                  String(credits?.userCredits ?? 0)
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {packages?.slice(0, 3).map((pkg) => {
            const pkgContent = getPackageContent(pkg.name)
            const isRecommended = pkg.id === recommendedPkg?.id

            return (
              <button
                type="button"
                key={pkg.id}
                onClick={() => canPurchase && handlePurchase(pkg.id)}
                disabled={isPending || !canPurchase}
                className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Coins className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pkgContent?.name?.value ?? pkg.name}</span>
                      {isRecommended && (
                        <Badge
                          variant="default"
                          className="text-xs"
                        >
                          <Sparkles className="mr-1 size-3" />
                          {content.insufficientCredits.recommended}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pkg.creditAmount} {content.packages.credits}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <span className="font-semibold">{formatPrice(pkg.priceAmount)}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          {!canPurchase && (
            <p className="text-sm text-muted-foreground">{content.packages.subscribeToPurchase}</p>
          )}
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => onOpenChange(false)}
          >
            {content.insufficientCredits.cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
