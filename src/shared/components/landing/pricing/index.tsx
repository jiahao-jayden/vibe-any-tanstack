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
import { useLocalizedNavigate } from "@/shared/hooks/use-localized-navigate"
import { authClient } from "@/shared/lib/auth/auth-client"
import { cn } from "@/shared/lib/utils"
import { usePaymentStore } from "@/shared/store/payment"

export function Pricing() {
  const navigate = useLocalizedNavigate()
  const { data: session } = authClient.useSession()
  const content = useIntlayer("pricing")

  const plans = getPlans()

  const {
    activePlan,
    activeSubscription,
    isLoading: isPaymentLoading,
    fetchPaymentInfo,
  } = usePaymentStore()

  const getDefaultPriceIndex = (planId: string, prices: Array<{ priceId: string }>) => {
    if (activeSubscription && prices) {
      const index = prices.findIndex((price) => price.priceId === activeSubscription.priceId)
      if (index !== -1) return index
    }

    if (activePlan && activePlan.id === planId && prices) {
      const activePriceId = activePlan.prices[0]?.priceId
      if (activePriceId) {
        const index = prices.findIndex((price) => price.priceId === activePriceId)
        if (index !== -1) return index
      }
    }

    return 0
  }

  const getPlanValue = (plan: {
    id: string
    prices?: Array<{ amount: number; interval?: string }>
  }): number => {
    if (!plan.prices || plan.prices.length === 0) return 0

    const maxPrice = Math.max(
      ...plan.prices.map((p) => {
        if (p.interval === "year") {
          return p.amount / 12
        }
        if (!p.interval || p.interval === "lifetime") {
          return p.amount * 10
        }
        return p.amount
      })
    )

    return maxPrice
  }

  const hasActivePaidSubscription = (): boolean => {
    if (activeSubscription) return true

    if (activePlan?.prices && activePlan.prices.length > 0) {
      return activePlan.prices.some((price) => price.amount > 0)
    }

    return false
  }

  const isDowngrade = (
    targetPlan: {
      id: string
      prices?: Array<{ amount: number; interval?: string; priceId: string }>
    },
    targetPriceId: string
  ): boolean => {
    if (!activePlan || !targetPlan.prices) return false

    if (activePlan.id === targetPlan.id) {
      const activePrice = activePlan.prices.find((p) =>
        activeSubscription ? p.priceId === activeSubscription.priceId : true
      )
      const targetPrice = targetPlan.prices.find((p) => p.priceId === targetPriceId)

      if (activePrice && targetPrice) {
        const activeMonthly =
          activePrice.interval === "year" ? activePrice.amount / 12 : activePrice.amount
        const targetMonthly =
          targetPrice.interval === "year" ? targetPrice.amount / 12 : targetPrice.amount
        return targetMonthly < activeMonthly
      }
    }

    const currentPlanValue = getPlanValue(activePlan)
    const targetPlanValue = getPlanValue(targetPlan)

    return targetPlanValue < currentPlanValue
  }

  const [selectedPrices, setSelectedPrices] = useState<Record<string, number>>({})
  const [loadingPlan, setLoadingPlan] = useState<{ planId: string; priceId: string } | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchPaymentInfo(session.user.id)
    }
  }, [session?.user?.id, fetchPaymentInfo])

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
  }, [activePlan, activeSubscription, plans])

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
    mutationFn: async ({ planId, priceId }: { planId: string; priceId: string }) => {
      if (!session?.user) {
        toast.error(content.loginRequired.value)
        navigate("/login")
        return
      }

      setLoadingPlan({ planId, priceId })

      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          priceId,
          successUrl: `${window.location.origin}/dashboard/billing`,
        }),
      })

      if (!response.ok) {
        throw new Error("Payment request failed")
      }

      return response.json()
    },
    onSuccess: (res) => {
      if (res?.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      } else {
        toast.error(content.paymentFailed.value)
      }
    },
    onError: () => {
      toast.error(content.paymentFailed.value)
      setLoadingPlan(null)
    },
    onSettled: () => {
      setLoadingPlan(null)
    },
  })

  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">{content.title.value}</h1>
          <p>{content.subtitle.value}</p>
        </div>

        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-3">
          {plans.map((plan) => {
            const defaultIndex = plan.prices ? getDefaultPriceIndex(plan.id, plan.prices) : 0
            const selectedIndex = selectedPrices[plan.id] ?? defaultIndex
            const displayPrice = plan.prices?.[selectedIndex]
            const isPopular = plan.display?.isRecommended
            const planContent = getPlanContent(plan.id)

            return (
              <Card
                key={plan.id}
                className={cn("flex h-full flex-col", isPopular && "relative")}
              >
                {isPopular && (
                  <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">
                    {content.popular.value}
                  </span>
                )}

                <div className="flex flex-1 flex-col">
                  <CardHeader className="pb-4">
                    <CardTitle className="font-medium">{planContent.title}</CardTitle>
                    <CardDescription className="text-sm">{planContent.description}</CardDescription>
                    <div className="mt-4">
                      <div className="flex items-baseline gap-2">
                        {displayPrice ? (
                          <>
                            <span className="text-3xl font-bold">${displayPrice.amount / 100}</span>
                            <span className="text-sm text-muted-foreground">
                              /{getIntervalText(displayPrice.interval)}
                            </span>
                          </>
                        ) : (
                          <span className="text-3xl font-bold">{content.free.value}</span>
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
                          className="mt-4 space-y-2"
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
                                className="cursor-pointer"
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

                  <CardContent className="flex-1 space-y-4">
                    <hr className="border-dashed" />

                    <ul className="list-outside space-y-3 text-sm">
                      {planContent.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2"
                        >
                          <Check className="size-3" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4">
                    {plan.prices && plan.prices.length > 0 ? (
                      (() => {
                        const priceIndex = selectedPrices[plan.id] || 0
                        const selectedPrice = plan.prices[priceIndex]
                        const isCurrentButtonLoading =
                          loadingPlan?.planId === plan.id &&
                          loadingPlan?.priceId === selectedPrice.priceId
                        const isAnyButtonLoading = isPending && loadingPlan !== null

                        const isCurrentPlan =
                          activePlan?.id === plan.id &&
                          (activeSubscription?.priceId === selectedPrice.priceId ||
                            activePlan.prices.some((p) => p.priceId === selectedPrice.priceId))

                        const isPlanDowngrade = isDowngrade(plan, selectedPrice.priceId)

                        const hasPaidSubAndDifferentPlan =
                          hasActivePaidSubscription() && !isCurrentPlan

                        return (
                          <Button
                            variant={
                              isCurrentPlan
                                ? "secondary"
                                : isPlanDowngrade || hasPaidSubAndDifferentPlan
                                  ? "ghost"
                                  : isPopular
                                    ? "default"
                                    : "outline"
                            }
                            className="w-full"
                            onClick={() => {
                              if (
                                isCurrentPlan ||
                                isPlanDowngrade ||
                                hasPaidSubAndDifferentPlan ||
                                isPaymentLoading
                              )
                                return

                              handlePayment({ planId: plan.id, priceId: selectedPrice.priceId })
                            }}
                            disabled={
                              isAnyButtonLoading ||
                              isCurrentPlan ||
                              isPlanDowngrade ||
                              hasPaidSubAndDifferentPlan ||
                              isPaymentLoading
                            }
                          >
                            {isCurrentButtonLoading ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                {content.processing.value}
                              </>
                            ) : isPaymentLoading ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                {content.loading.value}
                              </>
                            ) : isCurrentPlan ? (
                              content.currentPlan.value
                            ) : isPlanDowngrade ? (
                              content.downgradePlan.value
                            ) : hasPaidSubAndDifferentPlan ? (
                              content.alreadySubscribed.value
                            ) : (
                              content.getStarted.value
                            )}
                          </Button>
                        )
                      })()
                    ) : (
                      <Button variant="secondary" className="w-full" disabled>
                        {content.free.value}
                      </Button>
                    )}
                  </CardFooter>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
