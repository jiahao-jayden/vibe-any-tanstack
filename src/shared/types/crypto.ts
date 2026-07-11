export type CryptoChain = "solana" | "bitcoin" | "ethereum" | "tron" | "bsc"

export type CryptoProviderId = "solanapay" | "payram" | "evm_direct"

export const cryptoCurrencyIds = [
  "usdc_sol",
  "sol",
  "btc",
  "eth",
  "trx",
  "usdt_erc20",
  "usdt_trc20",
  "bnb_bsc",
  "usdt_bep20",
] as const

export type CryptoCurrencyId = (typeof cryptoCurrencyIds)[number]

export type CheckoutDisplayStatus =
  | "waiting_payment"
  | "confirming"
  | "paid"
  | "expired"
  | "review_required"

export type CryptoDetailedStatus =
  | CheckoutDisplayStatus
  | "underpaid"
  | "overpaid"
  | "late_payment"
  | "duplicate_payment"
  | "canceled"

export type CryptoPaymentErrorCode =
  | "crypto_disabled"
  | "invalid_crypto_currency"
  | "crypto_price_not_configured"
  | "crypto_quote_unavailable"
  | "crypto_quote_timeout"
  | "crypto_quote_invalid"
  | "wallet_not_configured"
  | "invalid_wallet_address"
  | "invalid_reference"
  | "checkout_expired"
  | "payment_not_found"
  | "payment_already_processed"
  | "payment_underpaid"
  | "payment_overpaid"
  | "payment_late"
  | "payment_duplicate"
  | "payment_amount_mismatch"
  | "payment_rate_limited"
  | "payment_validation_failed"
  | "payment_review_required"
  | "provider_unavailable"
  | "webhook_signature_invalid"
  | "provider_mapping_invalid"
  | "invalid_tx_hash"
  | "wrong_network"
  | "transaction_failed"
  | "transaction_too_old"
  | "wrong_asset"
  | "wrong_recipient"
  | "rpc_unavailable"

export type CryptoPricingMode = "fiat_peg" | "live_quote"

interface BaseCryptoOrderMetadata {
  paymentMethod: "crypto"
  cryptoProvider: CryptoProviderId
  cryptoCurrency: CryptoCurrencyId
  detailedStatus: CryptoDetailedStatus
  checkoutExpiresAt: string
  cryptoAmount: string
  fiatAmount: string
  fiatCurrency: string
  walletAddress: string
  network: string
  planId: string
  priceId: string
  priceInterval?: string
  explorerUrl?: string
  reviewReason?: string
  reviewCode?: CryptoPaymentErrorCode
  txSignature?: string
  actualAmount?: string
  amountVariance?: string
  confirmedAt?: string
  cancellationReason?: string
  providerExpiresAt?: string
  quoteSource?: string
  quoteRate?: string
  quotedAt?: string
  quoteExpiresAt?: string
  latePayment?: "true" | "false"
  overpaid?: "true" | "false"
  underpaid?: "true" | "false"
  duplicatePayment?: "true" | "false"
}

export interface SolanaCryptoOrderMetadata extends BaseCryptoOrderMetadata {
  cryptoProvider: "solanapay"
  referenceKey: string
  solanaPayUrl: string
  memo: string
  tokenMint?: string
}

export interface PayRamCryptoOrderMetadata extends BaseCryptoOrderMetadata {
  cryptoProvider: "payram"
  providerPaymentId: string
  payramPaymentUrl?: string
  payramQrPayload?: string
  payramNetwork?: string
  payramCurrencyCode?: string
  payramStandard?: string
  payramStatus?: string
  webhookLastProcessedAt?: string
  webhookEventId?: string
}

export interface EvmDirectCryptoOrderMetadata extends BaseCryptoOrderMetadata {
  cryptoProvider: "evm_direct"
  evmChainId: string
  evmAssetType: "native" | "erc20"
  submittedTxHash?: string
  tokenAddress?: string
  detectedBlockNumber?: string
  detectedConfirmations?: string
  requiredConfirmations?: string
  txSubmittedAt?: string
}

export type CryptoOrderMetadata =
  | SolanaCryptoOrderMetadata
  | PayRamCryptoOrderMetadata
  | EvmDirectCryptoOrderMetadata

interface BaseCryptoCheckoutData {
  orderId: string
  provider: "crypto"
  cryptoProvider: CryptoProviderId
  status: CheckoutDisplayStatus
  detailedStatus: CryptoDetailedStatus
  planId: string
  priceId: string
  cryptoCurrency: CryptoCurrencyId
  cryptoAmount: string
  fiatEquivalent: {
    amount: string
    currency: string
  }
  walletAddress: string
  network: string
  expiresAt: string
  remainingSeconds: number
  explorerUrl?: string
  reviewReason?: string
}

export interface SolanaCheckoutData extends BaseCryptoCheckoutData {
  cryptoProvider: "solanapay"
  referenceKey: string
  solanaPayUrl: string
  memo: string
  tokenMint?: string
  txSignature?: string
  estimatedConfirmSeconds?: number
}

export interface PayRamCheckoutData extends BaseCryptoCheckoutData {
  cryptoProvider: "payram"
  providerPaymentId: string
  payramPaymentUrl?: string
  payramQrPayload?: string
  payramCurrencyCode?: string
  payramStandard?: string
  payramStatus?: string
}

export interface EvmDirectCheckoutData extends BaseCryptoCheckoutData {
  cryptoProvider: "evm_direct"
  evmAssetType: "native" | "erc20"
  submittedTxHash?: string
  tokenAddress?: string
  requiredConfirmations?: number
  currentConfirmations?: number
}

export type CryptoCheckoutData = SolanaCheckoutData | PayRamCheckoutData | EvmDirectCheckoutData

export interface ResolvedCryptoPrice {
  cryptoCurrency: CryptoCurrencyId
  cryptoAmount: string
  fiatAmount: string
  fiatCurrency: string
  quoteSource?: string
  quoteRate?: string
  quotedAt?: string
  quoteExpiresAt?: string
  planId: string
  priceId: string
  interval?: string
}
