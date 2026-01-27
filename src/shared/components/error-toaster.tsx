import { useEffect } from "react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { errorEmitter } from "@/shared/lib/tools/error-emitter"

export function ErrorToaster() {
  const errorMessages = useIntlayer("error")

  useEffect(() => {
    return errorEmitter.subscribe((error) => {
      const errorCode = error.error as keyof typeof errorMessages | undefined

      const toastOptions = { position: "top-center" as const }

      if (errorCode && errorCode in errorMessages) {
        const translated = errorMessages[errorCode]
        toast.error(
          typeof translated === "object" && "value" in translated
            ? translated.value
            : error.message,
          toastOptions
        )
      } else {
        toast.error(error.message || errorMessages.UNKNOWN_ERROR.value, toastOptions)
      }
    })
  }, [errorMessages])

  return null
}
