import { AlertCircleIcon, CheckCircle2Icon, Clock3Icon, LoaderCircleIcon } from "lucide-react"
import { useIntlayer } from "react-intlayer"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { cn } from "@/shared/lib/utils"
import type { CryptoCheckoutData, CryptoCurrencyId } from "@/shared/types/crypto"
import { CryptoCurrencySelector } from "./crypto-currency-selector"
import { EvmPaymentDetails } from "./evm-payment-details"
import { PayRamPaymentDetails } from "./payram-payment-details"
import { SolanaPaymentDetails } from "./solana-payment-details"

interface CryptoCheckoutCardProps {
  checkout: CryptoCheckoutData
  currencyOptions: Array<{ id: CryptoCurrencyId; label: string }>
  isSwitchingCurrency?: boolean
  isSubmittingTx?: boolean
  txHashErrorMessage?: string
  showNetworkCongestionHint?: boolean
  onCurrencyChange: (value: CryptoCurrencyId) => void
  onRetry: () => void
  onSubmitTxHash?: (txHash: string) => void
}

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

function getCheckoutDisplayUnit(checkout: CryptoCheckoutData) {
  switch (checkout.cryptoCurrency) {
    case "usdc_sol":
      return "USDC"
    case "usdt_erc20":
    case "usdt_trc20":
    case "usdt_bep20":
      return "USDT"
    case "bnb_bsc":
      return "BNB"
    default:
      return checkout.cryptoCurrency.toUpperCase()
  }
}

export function CryptoCheckoutCard({
  checkout,
  currencyOptions,
  isSwitchingCurrency,
  isSubmittingTx,
  txHashErrorMessage,
  showNetworkCongestionHint,
  onCurrencyChange,
  onRetry,
  onSubmitTxHash,
}: CryptoCheckoutCardProps) {
  const content = useIntlayer("crypto-checkout")
  const isPayableState = checkout.status === "waiting_payment" || checkout.status === "confirming"
  const canSwitchCurrency = checkout.status === "waiting_payment"
  const detailLabelClassName = "text-xs uppercase tracking-wide text-muted-foreground"

  const statusLabel = {
    waiting_payment: content.statusWaiting.value,
    confirming: content.statusConfirming.value,
    paid: content.statusPaid.value,
    expired: content.statusExpired.value,
    review_required: content.statusReview.value,
  }[checkout.status]

  const statusIcon =
    checkout.status === "paid" ? (
      <CheckCircle2Icon className="size-4" />
    ) : checkout.status === "confirming" ? (
      <LoaderCircleIcon className="size-4 animate-spin" />
    ) : checkout.status === "expired" || checkout.status === "review_required" ? (
      <AlertCircleIcon className="size-4" />
    ) : (
      <Clock3Icon className="size-4" />
    )

  return (
    <Card className="border-border/60 bg-card/95">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{content.title.value}</CardTitle>
            <p className="text-sm text-muted-foreground">{content.subtitle.value}</p>
          </div>
          <Badge
            variant={checkout.status === "paid" ? "default" : "outline"}
            className={cn(
              "gap-1.5",
              checkout.status === "review_required" && "border-amber-500 text-amber-700",
              checkout.status === "expired" && "border-destructive text-destructive"
            )}
          >
            {statusIcon}
            {statusLabel}
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <div className={detailLabelClassName}>{content.amountLabel.value}</div>
            <div className="text-3xl font-semibold uppercase">
              {checkout.cryptoAmount} {getCheckoutDisplayUnit(checkout)}
            </div>
            <div className="text-sm text-muted-foreground">
              {content.fiatLabel.value}: {checkout.fiatEquivalent.amount}{" "}
              {checkout.fiatEquivalent.currency}
            </div>
          </div>

          <div className="space-y-2">
            <div className={detailLabelClassName}>{content.expiresLabel.value}</div>
            <div className="text-3xl font-semibold">
              {formatRemaining(checkout.remainingSeconds)}
            </div>
            <div className="text-sm text-muted-foreground">
              {content.networkLabel.value}: {checkout.network}
            </div>
            {"estimatedConfirmSeconds" in checkout && checkout.estimatedConfirmSeconds ? (
              <div className="text-sm text-muted-foreground">
                {content.estimatedConfirmLabel.value}: ~{checkout.estimatedConfirmSeconds}s
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "space-y-4",
          isPayableState &&
            (checkout.cryptoProvider === "solanapay"
              ? "grid gap-6 space-y-0 lg:grid-cols-[1.05fr_0.95fr]"
              : "grid gap-6 space-y-0")
        )}
      >
        {isPayableState ? (
          <div className="space-y-4">
            <div className="space-y-3 rounded-xl border p-4">
              <div className="space-y-1">
                <div className={detailLabelClassName}>{content.switchCurrency.value}</div>
                <CryptoCurrencySelector
                  value={checkout.cryptoCurrency}
                  options={currencyOptions}
                  onValueChange={onCurrencyChange}
                  disabled={isSwitchingCurrency || !canSwitchCurrency}
                  ariaLabel={content.switchCurrency.value}
                />
              </div>
            </div>

            {checkout.cryptoProvider === "solanapay" ? (
              <SolanaPaymentDetails
                checkout={checkout}
                showNetworkCongestionHint={showNetworkCongestionHint}
              />
            ) : checkout.cryptoProvider === "evm_direct" ? (
              <EvmPaymentDetails
                checkout={checkout}
                isSubmittingTx={isSubmittingTx}
                txHashErrorMessage={txHashErrorMessage}
                onSubmitTxHash={onSubmitTxHash}
              />
            ) : (
              <PayRamPaymentDetails checkout={checkout} />
            )}
          </div>
        ) : null}

        <div className="space-y-4">
          {checkout.status === "paid" && (
            <Alert>
              <CheckCircle2Icon className="size-4" />
              <AlertTitle>{content.statusPaid.value}</AlertTitle>
              <AlertDescription>{content.paidDescription.value}</AlertDescription>
            </Alert>
          )}

          {checkout.status === "expired" && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>{content.statusExpired.value}</AlertTitle>
              <AlertDescription>{content.expiredDescription.value}</AlertDescription>
            </Alert>
          )}

          {checkout.status === "review_required" && (
            <Alert>
              <AlertCircleIcon className="size-4" />
              <AlertTitle>{content.statusReview.value}</AlertTitle>
              <AlertDescription>
                {checkout.reviewReason || content.reviewDescription.value}
              </AlertDescription>
            </Alert>
          )}

          {checkout.status === "expired" && (
            <Button
              type="button"
              className="w-full"
              onClick={onRetry}
            >
              {content.retry.value}
            </Button>
          )}

          {checkout.explorerUrl && (!isPayableState || checkout.cryptoProvider !== "evm_direct") && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => window.open(checkout.explorerUrl, "_blank", "noopener,noreferrer")}
            >
              {content.explorer.value}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
