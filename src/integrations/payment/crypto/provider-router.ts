import type { CryptoCurrencyId, CryptoProviderId } from "@/shared/types/crypto"
import { getCryptoCurrencyConfig } from "./currencies"
import { CryptoPaymentError } from "./errors"

export function resolveCryptoProviderIdForCurrency(
  cryptoCurrency: CryptoCurrencyId
): CryptoProviderId {
  const currencyConfig = getCryptoCurrencyConfig(cryptoCurrency)
  if (!currencyConfig?.enabled) {
    throw new CryptoPaymentError({
      code: "provider_mapping_invalid",
      statusCode: 400,
      userMessage: "The selected crypto currency is invalid.",
      message: `No enabled crypto provider mapping found for currency: ${cryptoCurrency}`,
      context: { cryptoCurrency },
    })
  }

  return currencyConfig.cryptoProvider
}
