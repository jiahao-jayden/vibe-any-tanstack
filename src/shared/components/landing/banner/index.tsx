import { useIntlayer } from "react-intlayer"
import { cn } from "@/shared/lib/utils"

export default function Banner() {
  const { banner } = useIntlayer("landing")

  if (!banner.text.value.trim()) {
    return null
  }

  const href = banner.button.href.value
  const isExternal = href.startsWith("http")

  return (
    <div
      className={cn(
        "w-full bg-black text-white py-2 px-4 text-center text-sm min-h-12",
        "flex items-center justify-center"
      )}
    >
      <span className="text-balance">
        {banner.text.value}{" "}
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="underline hover:no-underline transition-all"
        >
          {banner.button.text.value}
        </a>
      </span>
    </div>
  )
}
