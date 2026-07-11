import type { CryptoCurrencyId } from "@/shared/types/crypto"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

interface CryptoCurrencyOption {
  id: CryptoCurrencyId
  label: string
}

interface CryptoCurrencySelectorProps {
  value: CryptoCurrencyId
  options: CryptoCurrencyOption[]
  onValueChange: (value: CryptoCurrencyId) => void
  disabled?: boolean
  triggerId?: string
  ariaLabel?: string
  ariaLabelledby?: string
}

export function CryptoCurrencySelector({
  value,
  options,
  onValueChange,
  disabled,
  triggerId,
  ariaLabel,
  ariaLabelledby,
}: CryptoCurrencySelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as CryptoCurrencyId)}
      disabled={disabled}
    >
      <SelectTrigger
        id={triggerId}
        className="w-full"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.id}
            value={option.id}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
