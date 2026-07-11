import { AlertCircleIcon } from "lucide-react"
import { useIntlayer } from "react-intlayer"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Separator } from "@/shared/components/ui/separator"
import type { SolanaCheckoutData } from "@/shared/types/crypto"
import { CryptoQrDisplay } from "./crypto-qr-display"

interface SolanaPaymentDetailsProps {
  checkout: SolanaCheckoutData
  showNetworkCongestionHint?: boolean
}

export function SolanaPaymentDetails({
  checkout,
  showNetworkCongestionHint,
}: SolanaPaymentDetailsProps) {
  const content = useIntlayer("crypto-checkout")
  const detailLabelClassName = "text-xs uppercase tracking-wide text-muted-foreground"

  return (
    <>
      <CryptoQrDisplay
        solanaPayUrl={checkout.solanaPayUrl}
        walletAddress={checkout.walletAddress}
      />

      <div className="space-y-4">
        <div className="space-y-3 rounded-xl border p-4">
          <div className="space-y-1">
            <div className={detailLabelClassName}>{content.addressLabel.value}</div>
            <p className="break-all font-mono text-sm">{checkout.walletAddress}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <div className={detailLabelClassName}>{content.referenceLabel.value}</div>
            <p className="break-all font-mono text-sm">{checkout.referenceKey}</p>
          </div>

          <div className="space-y-1">
            <div className={detailLabelClassName}>{content.memoLabel.value}</div>
            <p className="break-all font-mono text-sm">{checkout.memo}</p>
          </div>
        </div>

        <Alert>
          <AlertCircleIcon className="size-4" />
          <AlertTitle>{content.irreversible.value}</AlertTitle>
          <AlertDescription>{content.noRefund.value}</AlertDescription>
        </Alert>

        {showNetworkCongestionHint && (
          <Alert>
            <AlertCircleIcon className="size-4" />
            <AlertTitle>{content.networkCongestionTitle.value}</AlertTitle>
            <AlertDescription>{content.networkCongestionDescription.value}</AlertDescription>
          </Alert>
        )}
      </div>
    </>
  )
}
