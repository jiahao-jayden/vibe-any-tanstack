import { AlertCircleIcon, ExternalLinkIcon } from "lucide-react"
import { useIntlayer } from "react-intlayer"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Separator } from "@/shared/components/ui/separator"
import type { EvmDirectCheckoutData } from "@/shared/types/crypto"

interface EvmPaymentDetailsProps {
  checkout: EvmDirectCheckoutData
  isSubmittingTx?: boolean
  txHashErrorMessage?: string
  onSubmitTxHash?: (txHash: string) => void
}

function getAssetLabel(checkout: EvmDirectCheckoutData) {
  if (checkout.cryptoCurrency === "bnb_bsc") {
    return "BNB"
  }

  if (checkout.cryptoCurrency === "usdt_bep20") {
    return "USDT / BEP20"
  }

  return checkout.cryptoCurrency.toUpperCase()
}

export function EvmPaymentDetails({
  checkout,
  isSubmittingTx,
  txHashErrorMessage,
  onSubmitTxHash,
}: EvmPaymentDetailsProps) {
  const content = useIntlayer("crypto-checkout")
  const detailLabelClassName = "text-xs uppercase tracking-wide text-muted-foreground"
  const assetHelpText =
    checkout.cryptoCurrency === "bnb_bsc"
      ? (content as Record<string, { value: string } | undefined>).evmTxHashHelpNative?.value
      : (content as Record<string, { value: string } | undefined>).evmTxHashHelpToken?.value

  return (
    <div className="space-y-4 lg:col-start-2">
      <div className="space-y-3 rounded-xl border p-4">
        <div className="space-y-1">
          <div className={detailLabelClassName}>{content.addressLabel.value}</div>
          <p className="break-all font-mono text-sm">{checkout.walletAddress}</p>
        </div>

        <Separator />

        <div className="space-y-1">
          <div className={detailLabelClassName}>{content.networkLabel.value}</div>
          <p className="text-sm">{checkout.network}</p>
        </div>

        <Separator />

        <div className="space-y-1">
          <div className={detailLabelClassName}>{content.amountLabel.value}</div>
          <p className="text-sm font-semibold uppercase">
            {checkout.cryptoAmount} {getAssetLabel(checkout)}
          </p>
          <p className="text-xs text-muted-foreground">
            {content.fiatLabel.value}: {checkout.fiatEquivalent.amount} {checkout.fiatEquivalent.currency}
          </p>
        </div>

        <Separator />

        <div className="space-y-1">
          <div className={detailLabelClassName}>
            {(content as Record<string, { value: string } | undefined>).cryptoCurrencyLabel
              ?.value ?? "Asset"}
          </div>
          <p className="text-sm">{getAssetLabel(checkout)}</p>
        </div>

        {checkout.tokenAddress ? (
          <>
            <Separator />

            <div className="space-y-1">
              <div className={detailLabelClassName}>Token contract</div>
              <p className="break-all font-mono text-sm">{checkout.tokenAddress}</p>
            </div>
          </>
        ) : null}
      </div>

      <form
        key={checkout.submittedTxHash ?? checkout.orderId}
        className="space-y-3 rounded-xl border p-4"
        onSubmit={(event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          const txHash = String(formData.get("txHash") ?? "").trim()
          if (txHash.length > 0) {
            onSubmitTxHash?.(txHash)
          }
        }}
      >
        <div className="space-y-1">
          <div className={detailLabelClassName}>
            {(content as Record<string, { value: string } | undefined>).evmTxHashLabel?.value ??
              "Transaction hash"}
          </div>
          <Input
            name="txHash"
            defaultValue={checkout.submittedTxHash ?? ""}
            placeholder={
              (content as Record<string, { value: string } | undefined>).evmTxHashPlaceholder
                ?.value ?? "Paste your transaction hash"
            }
            disabled={isSubmittingTx}
          />
          {assetHelpText ? <p className="text-xs text-muted-foreground">{assetHelpText}</p> : null}
          {txHashErrorMessage ? <p className="text-sm text-destructive">{txHashErrorMessage}</p> : null}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmittingTx}
        >
          {(content as Record<string, { value: string } | undefined>).evmSubmitTx?.value ??
            "Submit transaction hash"}
        </Button>

        {checkout.explorerUrl ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => window.open(checkout.explorerUrl, "_blank", "noopener,noreferrer")}
          >
            <ExternalLinkIcon className="mr-2 size-4" />
            {content.explorer.value}
          </Button>
        ) : null}

        {typeof checkout.currentConfirmations === "number" &&
        typeof checkout.requiredConfirmations === "number" ? (
          <div className="space-y-1">
            <div className={detailLabelClassName}>
              {(content as Record<string, { value: string } | undefined>).evmConfirmProgress
                ?.value ?? "Confirmations"}
            </div>
            <p className="font-mono text-sm">
              {checkout.currentConfirmations} / {checkout.requiredConfirmations}
            </p>
          </div>
        ) : null}
      </form>

      <Alert>
        <AlertCircleIcon className="size-4" />
        <AlertTitle>{content.irreversible.value}</AlertTitle>
        <AlertDescription>{content.noRefund.value}</AlertDescription>
      </Alert>
    </div>
  )
}
