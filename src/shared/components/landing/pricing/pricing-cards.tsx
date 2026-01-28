import { useMutation } from "@tanstack/react-query"
import { Check, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { getPlans } from "@/config/payment-config"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Label } from "@/shared/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group"
import { useGlobalContext } from "@/shared/context/global.context"
import { useLocalizedNavigate } from "@/shared/hooks/use-localized-navigate"
import { usePlanComparison } from "@/shared/hooks/use-plan-comparison"
import { cn } from "@/shared/lib/utils"

interface PricingCardsProps {
  variant?: "default" | "compact"
  onSuccess?: () => void
}

export function PricingCards({ variant = "default", onSuccess }: PricingCardsProps) {
  const navigate = useLocalizedNavigate()
  const { userInfo, isLoadingUserInfo } = useGlobalContext()
  const content = useIntlayer("pricing")
  const {
    activePlan,
    activeSubscription,
    getDefaultPriceIndex,
    isCurrentPlan,
    isDowngrade,
    isUpgrade,
  } = usePlanComparison()

  const plans = getPlans()
  const isCompact = variant === "compact"

  const [selectedPrices, setSelectedPrices] = useState<Record<string, number>>({})
  const [loadingPlan, setLoadingPlan] = useState<{ planId: string; priceId: string } | null>(null)

  useEffect(() => {
    if (plans && (activePlan || activeSubscription)) {
      const defaultPrices: Record<string, number> = {}

      plans.forEach((plan) => {
        if (plan.prices) {
          const defaultIndex = getDefaultPriceIndex(plan.id, plan.prices)
          if (defaultIndex > 0) {
            defaultPrices[plan.id] = defaultIndex
          }
        }
      })

      if (Object.keys(defaultPrices).length > 0) {
        setSelectedPrices(defaultPrices)
      }
    }
  }, [activePlan, activeSubscription, plans, getDefaultPriceIndex])

  const getPlanContent = (planId: string) => {
    const planKey = planId as keyof typeof content.plans
    const planContent = content.plans[planKey]
    if (planContent) {
      return {
        title: planContent.title.value,
        description: planContent.description.value,
        features: planContent.features.map((f) => f.value),
      }
    }
    return { title: planId, description: "", features: [] }
  }

  const getIntervalText = (interval?: string) => {
    if (!interval) return content.once.value
    if (interval === "month") return content.month.value
    if (interval === "year") return content.year.value
    return interval
  }

  const { mutate: handlePayment, isPending } = useMutation({
    mutationFn: async ({
      planId,
      priceId,
      isUpgradeAction,
    }: {
      planId: string
      priceId: string
      isUpgradeAction: boolean
    }) => {
      if (!userInfo?.user) {
        toast.error(content.loginRequired.value)
        navigate("/login")
        return
      }

      setLoadingPlan({ planId, priceId })

      const endpoint = isUpgradeAction ? "/api/payment/upgrade" : "/api/payment/checkout"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          priceId,
          successUrl: `${window.location.origin}/dashboard/billing`,
        }),
      })

      if (!response.ok) {
        throw new Error(isUpgradeAction ? "Upgrade request failed" : "Payment request failed")
      }

      return { data: await response.json(), isUpgradeAction }
    },
    onSuccess: (res) => {
      if (res?.isUpgradeAction) {
        toast.success("Subscription upgraded successfully!")
        onSuccess?.()
        window.location.reload()
      } else if (res?.data?.data?.checkoutUrl) {
        window.location.href = res.data.data.checkoutUrl
      } else {
        toast.error(content.paymentFailed.value)
      }
    },
    onError: (_, variables) => {
      toast.error(
        variables.isUpgradeAction ? content.upgradeFailed.value : content.paymentFailed.value
      )
      setLoadingPlan(null)
    },
    onSettled: () => {
      setLoadingPlan(null)
    },
  })

  return (
    <div className={cn("grid gap-6", isCompact ? "md:grid-cols-3 gap-4" : "md:grid-cols-3")}>
      {plans.map((plan) => {
        const defaultIndex = plan.prices ? getDefaultPriceIndex(plan.id, plan.prices) : 0
        const selectedIndex = selectedPrices[plan.id] ?? defaultIndex
        const displayPrice = plan.prices?.[selectedIndex]
        const isPopular = plan.display?.isRecommended
        const planContent = getPlanContent(plan.id)

        return (
          <Card
            key={plan.id}
            className={cn(
              "flex h-full flex-col",
              isPopular && "relative",
              isCompact && "p-0",
              isCompact && isPopular && "border-primary ring-1 ring-primary"
            )}
          >
            {isPopular && !isCompact && (
              <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">
                {content.popular.value}
              </span>
            )}
            {isPopular && isCompact && (
              <span className="mx-4 mt-4 mb-0 w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {content.popular.value}
              </span>
            )}

            <div className="flex flex-1 flex-col">
              <CardHeader className={cn(isCompact && "p-4 pb-2")}>
                <CardTitle className={cn("font-medium", isCompact && "text-base")}>
                  {planContent.title}
                </CardTitle>
                <CardDescription className={cn("text-sm", isCompact && "text-xs")}>
                  {planContent.description}
                </CardDescription>
                <div className={cn("mt-4", isCompact && "mt-2")}>
                  <div className="flex items-baseline gap-2">
                    {displayPrice ? (
                      <>
                        <span className={cn("font-bold", isCompact ? "text-2xl" : "text-3xl")}>
                          ${displayPrice.amount / 100}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /{getIntervalText(displayPrice.interval)}
                        </span>
                      </>
                    ) : (
                      <span className={cn("font-bold", isCompact ? "text-2xl" : "text-3xl")}>
                        {content.free.value}
                      </span>
                    )}
                  </div>

                  {plan.prices && plan.prices.length > 1 && (
                    <RadioGroup
                      value={selectedIndex.toString()}
                      onValueChange={(value) => {
                        setSelectedPrices((prev) => ({
                          ...prev,
                          [plan.id]: Number.parseInt(value, 10),
                        }))
                      }}
                      className={cn("mt-4 space-y-2", isCompact && "mt-2 space-y-1")}
                    >
                      {plan.prices.map((price, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={idx.toString()}
                            id={`${plan.id}-price-${idx}`}
                          />
                          <Label
                            htmlFor={`${plan.id}-price-${idx}`}
                            className={cn("cursor-pointer", isCompact && "text-sm")}
                          >
                            ${price.amount / 100} / {getIntervalText(price.interval)}
                            {price.interval === "year" && (
                              <span className="ml-2 text-xs text-green-600">
                                {content.save20.value}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>
              </CardHeader>

              <CardContent className={cn("flex-1 space-y-4", isCompact && "p-4 pt-0 space-y-2")}>
                <hr className="border-dashed mt-3" />

                <ul
                  className={cn(
                    "list-outside space-y-3 text-sm",
                    isCompact && "space-y-1.5 text-xs"
                  )}
                >
                  {(isCompact ? planContent.features.slice(0, 4) : planContent.features).map(
                    (feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2"
                      >
                        <Check className={cn("size-3", isCompact && "text-green-600")} />
                        {feature}
                      </li>
                    )
                  )}
                  {isCompact && planContent.features.length > 4 && (
                    <li className="text-muted-foreground">
                      +{planContent.features.length - 4} more...
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter className={cn("pt-4", isCompact && "p-4 pt-0")}>
                {plan.prices && plan.prices.length > 0 ? (
                  (() => {
                    const priceIndex = selectedPrices[plan.id] || 0
                    const selectedPrice = plan.prices[priceIndex]
                    const isCurrentButtonLoading =
                      loadingPlan?.planId === plan.id &&
                      loadingPlan?.priceId === selectedPrice.priceId
                    const isAnyButtonLoading = isPending && loadingPlan !== null

                    const isCurrent = isCurrentPlan(plan, selectedPrice.priceId)
                    const isPlanDowngrade = isDowngrade(plan, selectedPrice.priceId)
                    const isPlanUpgrade = isUpgrade(plan, selectedPrice.priceId)

                    return (
                      <Button
                        size={isCompact ? "sm" : "default"}
                        variant={
                          isCurrent
                            ? "secondary"
                            : isPlanDowngrade
                              ? "ghost"
                              : isPopular
                                ? "default"
                                : "outline"
                        }
                        className="w-full"
                        onClick={() => {
                          if (isCurrent || isPlanDowngrade || isLoadingUserInfo) return

                          handlePayment({
                            planId: plan.id,
                            priceId: selectedPrice.priceId,
                            isUpgradeAction: isPlanUpgrade,
                          })
                        }}
                        disabled={
                          isAnyButtonLoading || isCurrent || isPlanDowngrade || isLoadingUserInfo
                        }
                      >
                        {isCurrentButtonLoading ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            {content.processing.value}
                          </>
                        ) : isLoadingUserInfo ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            {content.loading.value}
                          </>
                        ) : isCurrent ? (
                          content.currentPlan.value
                        ) : isPlanDowngrade ? (
                          content.downgradePlan.value
                        ) : isPlanUpgrade ? (
                          content.upgradePlan.value
                        ) : (
                          content.getStarted.value
                        )}
                      </Button>
                    )
                  })()
                ) : (
                  <Button
                    size={isCompact ? "sm" : "default"}
                    variant="secondary"
                    className="w-full"
                    disabled
                  >
                    {content.free.value}
                  </Button>
                )}
              </CardFooter>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
