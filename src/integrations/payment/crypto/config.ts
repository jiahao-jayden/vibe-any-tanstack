import { type CryptoCurrencyId, cryptoCurrencyIds } from "@/shared/types/crypto"

export type SolanaPayNetwork = "mainnet-beta" | "devnet" | "testnet"

type CryptoPaymentConfig = {
  enabled: boolean
  walletAddress: string
  network: SolanaPayNetwork
  rpcUrl: string
}

export type CryptoQuoteConfig = {
  provider: "binance" | "mock"
  apiUrl: string
  timeoutMs: number
  expiresInSeconds: number
}

export type PayRamConfig = {
  apiUrl: string
  apiKey: string
  webhookSecret: string
  callbackBaseUrl: string
}

function getEnv(key: string): string | undefined {
  if (Object.hasOwn(process.env, key)) {
    return process.env[key]
  }

  if (Object.hasOwn(import.meta.env, key)) {
    return import.meta.env[key]
  }

  return undefined
}

function getDefaultRpcUrl(network: SolanaPayNetwork) {
  switch (network) {
    case "mainnet-beta":
      return "https://api.mainnet-beta.solana.com"
    case "testnet":
      return "https://api.testnet.solana.com"
    default:
      return "https://api.devnet.solana.com"
  }
}

function getAppBaseUrl() {
  return getEnv("VITE_APP_URL") ?? "http://localhost:3377"
}

export function isCryptoPaymentEnabled() {
  return getEnv("VITE_CRYPTO_PAYMENT_ENABLED") === "true"
}

export function getEnabledCryptoCurrencyIds(): CryptoCurrencyId[] {
  const configuredCurrencyIds = getEnv("VITE_CRYPTO_ENABLED_CURRENCIES")

  if (configuredCurrencyIds === undefined) {
    return [...cryptoCurrencyIds]
  }

  const validCurrencyIds = configuredCurrencyIds
    .split(",")
    .map((currencyId) => currencyId.trim())
    .filter((currencyId): currencyId is CryptoCurrencyId =>
      cryptoCurrencyIds.includes(currencyId as CryptoCurrencyId)
    )

  return [...new Set(validCurrencyIds)]
}

export function getSolanaPayWalletAddress() {
  return getEnv("SOLANAPAY_WALLET_ADDRESS") ?? ""
}

export function getSolanaPayNetwork(): SolanaPayNetwork {
  const network = getEnv("SOLANAPAY_NETWORK")
  if (network === "mainnet-beta" || network === "testnet" || network === "devnet") {
    return network
  }
  return "devnet"
}

export function getSolanaPayRpcUrl() {
  return getEnv("SOLANAPAY_RPC_URL") || getDefaultRpcUrl(getSolanaPayNetwork())
}

export function getCryptoPaymentConfig(): CryptoPaymentConfig {
  return {
    enabled: isCryptoPaymentEnabled(),
    walletAddress: getSolanaPayWalletAddress(),
    network: getSolanaPayNetwork(),
    rpcUrl: getSolanaPayRpcUrl(),
  }
}

export function getCryptoQuoteConfig(): CryptoQuoteConfig {
  const configuredProvider = getEnv("CRYPTO_QUOTE_PROVIDER")
  const timeoutMs = Number.parseInt(getEnv("CRYPTO_QUOTE_TIMEOUT_MS") ?? "5000", 10)
  const expiresInSeconds = Number.parseInt(getEnv("CRYPTO_QUOTE_EXPIRES_IN_SECONDS") ?? "900", 10)

  return {
    provider: configuredProvider === "mock" ? "mock" : "binance",
    apiUrl: (getEnv("CRYPTO_QUOTE_API_URL") ?? "https://api.binance.com").replace(/\/$/, ""),
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5000,
    expiresInSeconds:
      Number.isFinite(expiresInSeconds) && expiresInSeconds > 0 ? expiresInSeconds : 900,
  }
}

export function getPayRamConfig(): PayRamConfig {
  return {
    apiUrl: (getEnv("PAYRAM_API_URL") ?? getEnv("PAYRAM_BASE_URL") ?? "").replace(/\/$/, ""),
    apiKey: getEnv("PAYRAM_API_KEY") ?? "",
    webhookSecret: getEnv("PAYRAM_WEBHOOK_SECRET") ?? getEnv("PAYRAM_API_KEY") ?? "",
    callbackBaseUrl: getAppBaseUrl().replace(/\/$/, ""),
  }
}

export function isPayRamConfigured() {
  const config = getPayRamConfig()
  return Boolean(config.apiUrl && config.apiKey)
}
