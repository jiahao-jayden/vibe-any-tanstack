import { useMutation } from "@tanstack/react-query"
import { Check, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { getPlans } from "@/config/payment-config"
import { isCryptoPaymentEnabled } from "@/integrations/payment/crypto/config"
import {
  getDefaultCryptoCurrencyId,
  getEnabledCryptoCurrencies,
} from "@/integrations/payment/crypto/currencies"
import { CryptoCurrencySelector } from "@/shared/components/crypto/crypto-currency-selector"
import {
  getPaymentMethodDisplayLabel,
  getLiveQuoteNote,
  getPriceDisplay,
  shouldShowLiveQuoteNote,
  shouldShowPaymentMethod,
} from "@/shared/components/landing/pricing/pricing-display"
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
import { HttpError, http } from "@/shared/lib/tools/http-client"
import { cn } from "@/shared/lib/utils"
import type { CryptoCurrencyId } from "@/shared/types/crypto"

interface PricingCardsProps {
  variant?: "default" | "compact"
  onSuccess?: () => void
}

type PricingErrorMessages = {
  paymentFailed: string
  upgradeFailed: string
  cryptoQuoteUnavailable: string
  cryptoQuoteTimeout: string
  cryptoQuoteInvalid: string
}

const cryptoEnabled = isCryptoPaymentEnabled()

export function getPricingCheckoutErrorMessage(
  error: unknown,
  isUpgradeAction: boolean,
  messages: PricingErrorMessages
) {
  if (error instanceof HttpError) {
    switch (error.errorCode) {
      case "crypto_quote_unavailable":
        return messages.cryptoQuoteUnavailable
      case "crypto_quote_timeout":
        return messages.cryptoQuoteTimeout
      case "crypto_quote_invalid":
        return messages.cryptoQuoteInvalid
      default:
        break
    }
  }

  return isUpgradeAction ? messages.upgradeFailed : messages.paymentFailed
}

export function PricingCards({ variant = "default", onSuccess }: PricingCardsProps) {
  const navigate = useLocalizedNavigate()
  const { userInfo, isLoadingUserInfo, config } = useGlobalContext()
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
  const defaultProvider = config?.public_payment_provider || "stripe"

  const [selectedPrices, setSelectedPrices] = useState<Record<string, number>>({})
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string>>({})
  const [selectedCryptoCurrencies, setSelectedCryptoCurrencies] = useState<
    Record<string, CryptoCurrencyId>
  >({})
  const [currentCryptoOrders, setCurrentCryptoOrders] = useState<Record<string, string>>({})
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
        features: planContent.features.map((feature: { value: string }) => feature.value),
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
      provider,
      cryptoCurrency,
      currentOrderId,
      isUpgradeAction,
    }: {
      planId: string
      priceId: string
      provider: string
      cryptoCurrency?: CryptoCurrencyId
      currentOrderId?: string
      isUpgradeAction: boolean
    }) => {
      if (!userInfo?.user) {
        toast.error(content.loginRequired.value)
        navigate("/login")
        return
      }

      setLoadingPlan({ planId, priceId })

      const isCryptoCheckout = provider === "crypto"
      const endpoint =
        isUpgradeAction && !isCryptoCheckout ? "/api/payment/upgrade" : "/api/payment/checkout"

      const data = await http<{ checkoutUrl?: string; orderId?: string; provider?: string }>(
        endpoint,
        {
          method: "POST",
          silent: isCryptoCheckout,
          body: {
            planId,
            priceId,
            provider,
            currentOrderId,
            successUrl: `${window.location.origin}/dashboard/billing`,
            metadata: {
              ...(isCryptoCheckout && cryptoCurrency ? { cryptoCurrency } : {}),
            },
          },
        }
      )

      return { data, isUpgradeAction, provider, planId, priceId }
    },
    onSuccess: (res) => {
      if (!res) {
        return
      }

      if (res.provider === "crypto" && res.data?.orderId) {
        setCurrentCryptoOrders((previous) => ({
          ...previous,
          [`${res.planId}:${res.priceId}`]: res.data!.orderId!,
        }))
        ;(navigate as (to: string) => void)(`/checkout/crypto/${res.data.orderId}`)
        return
      }

      if (res.isUpgradeAction) {
        toast.success("Subscription upgraded successfully!")
        onSuccess?.()
        window.location.reload()
      } else if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      } else {
        toast.error(content.paymentFailed.value)
      }
    },
    onError: (error, variables) => {
      toast.error(
        getPricingCheckoutErrorMessage(error, variables.isUpgradeAction, {
          paymentFailed: content.paymentFailed.value,
          upgradeFailed: content.upgradeFailed.value,
          cryptoQuoteUnavailable: content.cryptoQuoteUnavailable.value,
          cryptoQuoteTimeout: content.cryptoQuoteTimeout.value,
          cryptoQuoteInvalid: content.cryptoQuoteInvalid.value,
        })
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
        const providerKey = `${plan.id}:${displayPrice?.priceId || "default"}`
        const supportedCryptoCurrencies = displayPrice?.supportedCryptoCurrencies ?? []
        const cryptoCurrencies = getEnabledCryptoCurrencies(supportedCryptoCurrencies).map(
          (currency) => ({
            id: currency.id,
            label: currency.label,
          })
        )
        const defaultCryptoCurrency = getDefaultCryptoCurrencyId(supportedCryptoCurrencies)
        const hasCryptoOption = !!displayPrice && cryptoEnabled && cryptoCurrencies.length > 0
        const selectedProvider = selectedProviders[providerKey] || defaultProvider
        const selectedCryptoCurrency =
          selectedCryptoCurrencies[providerKey] &&
          cryptoCurrencies.some((currency) => currency.id === selectedCryptoCurrencies[providerKey])
            ? selectedCryptoCurrencies[providerKey]
            : defaultCryptoCurrency
        const currentPriceDisplay = displayPrice
          ? getPriceDisplay(displayPrice, selectedProvider, selectedCryptoCurrency)
          : null

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
                          {currentPriceDisplay?.isCrypto
                            ? `${currentPriceDisplay.amountText} ${currentPriceDisplay.unitText}`
                            : `${currentPriceDisplay?.unitText}${currentPriceDisplay?.amountText}`}
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
                      {plan.prices.map((price, idx) => {
                        const optionPriceDisplay = getPriceDisplay(
                          price,
                          selectedProvider,
                          selectedCryptoCurrency
                        )

                        return (
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
                              {optionPriceDisplay.isCrypto
                                ? `${optionPriceDisplay.amountText} ${optionPriceDisplay.unitText}`
                                : `${optionPriceDisplay.unitText}${optionPriceDisplay.amountText}`}
                              {" /"}
                              {getIntervalText(price.interval)}
                              {price.interval === "year" && (
                                <span className="ml-2 text-xs text-green-600">
                                  {content.save20.value}
                                </span>
                              )}
                            </Label>
                          </div>
                        )
                      })}
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
                    (feature: string, index: number) => (
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

                {displayPrice && shouldShowPaymentMethod(hasCryptoOption) && (
                  <div className="space-y-3 rounded-xl border border-dashed p-3">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        {content.paymentMethodLabel.value}
                      </div>
                      <RadioGroup
                        value={selectedProvider}
                        onValueChange={(value) =>
                          setSelectedProviders((prev) => ({
                            ...prev,
                            [providerKey]: value,
                          }))
                        }
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={defaultProvider}
                            id={`${providerKey}-default`}
                          />
                          <Label
                            htmlFor={`${providerKey}-default`}
                            className="cursor-pointer"
                          >
                            {getPaymentMethodDisplayLabel(
                              defaultProvider,
                              {
                                fiatLabel: content.defaultProviderLabel.value,
                                cardLabel: content.cardProviderLabel.value,
                                paypalLabel: content.paypalProviderLabel.value,
                                wechatLabel: content.wechatProviderLabel.value,
                                alipayLabel: content.alipayProviderLabel.value,
                              }
                            )}
                          </Label>
                        </div>

                        {hasCryptoOption && (
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="crypto"
                              id={`${providerKey}-crypto`}
                            />
                            <Label
                              htmlFor={`${providerKey}-crypto`}
                              className="cursor-pointer"
                            >
                              {content.cryptoProviderLabel.value}
                            </Label>
                          </div>
                        )}
                      </RadioGroup>
                    </div>

                    {selectedProvider === "crypto" && hasCryptoOption && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          {content.cryptoCurrencyLabel.value}
                        </div>
                        <CryptoCurrencySelector
                          value={selectedCryptoCurrency}
                          options={cryptoCurrencies}
                          onValueChange={(value) =>
                            setSelectedCryptoCurrencies((prev) => ({
                              ...prev,
                              [providerKey]: value,
                            }))
                          }
                          ariaLabel={content.cryptoCurrencyLabel.value}
                        />
                        <p className="text-xs text-muted-foreground">
                          {content.cryptoDisclaimer.value}
                        </p>
                        {shouldShowLiveQuoteNote(selectedProvider, selectedCryptoCurrency) && (
                          <p className="text-xs text-muted-foreground">
                            {getLiveQuoteNote(
                              content.cryptoLiveQuoteNotice.value,
                              selectedCryptoCurrency
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                    const selectedProviderKey = `${plan.id}:${selectedPrice.priceId}`
                    const provider = selectedProviders[selectedProviderKey] || defaultProvider
                    const cryptoCurrency =
                      selectedCryptoCurrencies[selectedProviderKey] &&
                      cryptoCurrencies.some(
                        (currency) => currency.id === selectedCryptoCurrencies[selectedProviderKey]
                      )
                        ? selectedCryptoCurrencies[selectedProviderKey]
                        : defaultCryptoCurrency
                    const currentOrderId = currentCryptoOrders[selectedProviderKey]

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
                            provider,
                            cryptoCurrency: cryptoCurrency ?? undefined,
                            currentOrderId,
                            isUpgradeAction: provider === "crypto" ? false : isPlanUpgrade,
                          })
                        }}
                        disabled={
                          isAnyButtonLoading ||
                          isCurrent ||
                          isPlanDowngrade ||
                          isLoadingUserInfo ||
                          (provider === "crypto" && !cryptoCurrency)
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
                        ) : isPlanUpgrade && provider !== "crypto" ? (
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
