import { CopyIcon, Link2Icon } from "lucide-react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/shared/components/ui/button"

interface CryptoQrDisplayProps {
  solanaPayUrl: string
  walletAddress: string
}

async function copyText(value: string, successMessage: string) {
  await navigator.clipboard.writeText(value)
  toast.success(successMessage)
}

export function CryptoQrDisplay({ solanaPayUrl, walletAddress }: CryptoQrDisplayProps) {
  const content = useIntlayer("crypto-checkout")

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card/60 p-4">
        <QRCodeSVG
          value={solanaPayUrl}
          size={220}
          className="mx-auto h-auto w-full max-w-56"
          includeMargin
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => copyText(walletAddress, content.copied.value)}
        >
          <CopyIcon className="size-4" />
          {content.copyAddress.value}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => copyText(solanaPayUrl, content.copied.value)}
        >
          <Link2Icon className="size-4" />
          {content.copyUrl.value}
        </Button>
      </div>
    </div>
  )
}
