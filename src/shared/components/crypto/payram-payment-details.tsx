import { AlertCircleIcon, CopyIcon, ExternalLinkIcon, Link2Icon } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import type { PayRamCheckoutData } from "@/shared/types/crypto"

interface PayRamPaymentDetailsProps {
  checkout: PayRamCheckoutData
}

async function copyText(value: string, successMessage: string) {
  await navigator.clipboard.writeText(value)
  toast.success(successMessage)
}

export function PayRamPaymentDetails({ checkout }: PayRamPaymentDetailsProps) {
  const content = useIntlayer("crypto-checkout")
  const contentRecord = content as Record<string, { value: string } | undefined>
  const detailLabelClassName = "text-xs uppercase tracking-wide text-muted-foreground"
  const paymentUrl = checkout.payramPaymentUrl

  return (
    <div className="space-y-4 lg:col-start-2">
      {checkout.payramQrPayload ? (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="rounded-xl border bg-card/60 p-4">
            <QRCodeSVG
              value={checkout.payramQrPayload}
              size={220}
              className="mx-auto h-auto w-full max-w-56"
              includeMargin
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => copyText(checkout.walletAddress, content.copied.value)}
            >
              <CopyIcon className="size-4" />
              {content.copyAddress.value}
            </Button>

            {paymentUrl ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => copyText(paymentUrl, content.copied.value)}
              >
                <Link2Icon className="size-4" />
                {contentRecord.copyUrl?.value ?? "Copy payment URL"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

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

        {(checkout.payramCurrencyCode || checkout.payramStandard) && (
          <>
            <Separator />

            <div className="space-y-1">
              <div className={detailLabelClassName}>
                {contentRecord.cryptoCurrencyLabel?.value ?? "Asset"}
              </div>
              <p className="text-sm">
                {[checkout.payramCurrencyCode, checkout.payramStandard].filter(Boolean).join(" / ")}
              </p>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-1">
          <div className={detailLabelClassName}>{content.referenceLabel.value}</div>
          <p className="break-all font-mono text-sm">{checkout.providerPaymentId}</p>
        </div>
      </div>

      <Alert>
        <AlertCircleIcon className="size-4" />
        <AlertTitle>{content.irreversible.value}</AlertTitle>
        <AlertDescription>
          {contentRecord.payramFeeNotice?.value ?? content.noRefund.value}
        </AlertDescription>
      </Alert>

      {paymentUrl ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => window.open(paymentUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLinkIcon className="mr-2 size-4" />
          {contentRecord.openHostedPage?.value ?? "Open hosted payment page"}
        </Button>
      ) : null}
    </div>
  )
}
