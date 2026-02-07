import { useMutation, useQuery } from "@tanstack/react-query"
import { Coins, Loader2, Package } from "lucide-react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { useGlobalContext } from "@/shared/context/global.context"
import { http } from "@/shared/lib/tools/http-client"
import type { CreditPackage } from "@/shared/types/payment"

export const CreditPackagesPanel = () => {
  const content = useIntlayer("user-dashboard")
  const creditPackagesDict = useIntlayer("credit-packages")
  const { credits, config, userInfo } = useGlobalContext()

  const isFreeUser = !userInfo?.payment?.activePlan
  const allowFreePurchase = config?.public_credit_allow_free_user_purchase ?? false
  const canPurchase = allowFreePurchase || !isFreeUser

  const { data: packages, isLoading } = useQuery({
    queryKey: ["credit-packages"],
    queryFn: () => http<CreditPackage[]>("/api/credit/packages"),
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{content.credits.title}</h2>
        <div className="mt-4 flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Coins className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{content.credits.balance}</p>
            <p className="text-2xl font-bold tabular-nums">{credits?.userCredits ?? 0}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-medium mb-4">{content.packages.title}</h3>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="pb-2">
                  <Skeleton className="h-8 w-16" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : !packages?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Package className="size-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium">{content.packages.empty}</p>
            <p className="mt-1 text-sm text-muted-foreground">{content.packages.emptyDesc}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {packages.map((pkg) => {
              const pkgContent = getPackageContent(pkg.name)

              return (
                <Card
                  key={pkg.id}
                  className="shadow-none"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{pkgContent?.name?.value ?? pkg.name}</p>
                        {pkgContent?.description && (
                          <p className="text-sm text-muted-foreground">
                            {pkgContent.description.value}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{formatPrice(pkg.priceAmount)}</span>
                      <span className="text-sm text-muted-foreground">
                        / {pkg.creditAmount} {content.packages.credits}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {pkg.expireDays
                        ? String(content.packages.validFor.value).replace(
                            "{days}",
                            String(pkg.expireDays)
                          )
                        : content.packages.neverExpires}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={isPending || !canPurchase}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          {content.packages.processing}
                        </>
                      ) : !canPurchase ? (
                        content.packages.subscribeToPurchase
                      ) : (
                        content.packages.buy
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
