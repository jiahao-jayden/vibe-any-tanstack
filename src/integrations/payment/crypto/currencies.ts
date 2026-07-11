import type {
  CryptoChain,
  CryptoCurrencyId,
  CryptoPricingMode,
  CryptoProviderId,
} from "@/shared/types/crypto"
import { getEnabledCryptoCurrencyIds, getSolanaPayNetwork } from "./config"

export interface CryptoCurrencyConfig {
  id: CryptoCurrencyId
  label: string
  chain: CryptoChain
  cryptoProvider: CryptoProviderId
  pricingMode: CryptoPricingMode
  decimals: number
  amountTolerance: string
  tokenMint?: string
  enabled: boolean
  sortOrder: number
  checkoutTimeout: number
  estimatedConfirmTime?: number
  payramNetwork?: string
  payramCurrencyCode?: string
  payramStandard?: string
  providerCheckoutTimeout?: number
  evmChainId?: number
  evmAssetType?: "native" | "erc20"
  evmTokenAddress?: string
  evmExplorerBaseUrl?: string
  minConfirmations?: number
  binanceSymbol?: string
}

const DEFAULT_CHECKOUT_TIMEOUT_SECONDS = 15 * 60
const DEFAULT_CONFIRM_TIME_SECONDS = 30
const DEFAULT_PAYRAM_CONFIRM_SECONDS = 180
const DEFAULT_EVM_CONFIRMATIONS = 15
const enabledCurrencyIds = getEnabledCryptoCurrencyIds()
const enabledCurrencyOrder = new Map(
  enabledCurrencyIds.map((currencyId, index) => [currencyId, index] as const)
)

const USDC_MAINNET_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"

export const CRYPTO_CURRENCIES: Record<CryptoCurrencyId, CryptoCurrencyConfig> = {
  usdc_sol: {
    id: "usdc_sol",
    label: "USDC (Solana)",
    chain: "solana",
    cryptoProvider: "solanapay",
    pricingMode: "fiat_peg",
    decimals: 6,
    amountTolerance: "0.01",
    tokenMint: getSolanaPayNetwork() === "mainnet-beta" ? USDC_MAINNET_MINT : USDC_DEVNET_MINT,
    enabled: enabledCurrencyIds.includes("usdc_sol"),
    sortOrder: 1,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_CONFIRM_TIME_SECONDS,
  },
  sol: {
    id: "sol",
    label: "SOL",
    chain: "solana",
    cryptoProvider: "solanapay",
    pricingMode: "live_quote",
    decimals: 9,
    amountTolerance: "0.001",
    enabled: enabledCurrencyIds.includes("sol"),
    sortOrder: 2,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_CONFIRM_TIME_SECONDS,
    binanceSymbol: "SOLUSDT",
  },
  btc: {
    id: "btc",
    label: "BTC",
    chain: "bitcoin",
    cryptoProvider: "payram",
    pricingMode: "live_quote",
    decimals: 8,
    amountTolerance: "0.00001",
    enabled: enabledCurrencyIds.includes("btc"),
    sortOrder: 3,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    payramNetwork: "Bitcoin",
    payramCurrencyCode: "BTC",
    payramStandard: "BTC",
    binanceSymbol: "BTCUSDT",
  },
  eth: {
    id: "eth",
    label: "ETH",
    chain: "ethereum",
    cryptoProvider: "payram",
    pricingMode: "live_quote",
    decimals: 18,
    amountTolerance: "0.0001",
    enabled: enabledCurrencyIds.includes("eth"),
    sortOrder: 4,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    payramNetwork: "Ethereum",
    payramCurrencyCode: "ETH",
    payramStandard: "ETH",
    binanceSymbol: "ETHUSDT",
  },
  trx: {
    id: "trx",
    label: "TRX",
    chain: "tron",
    cryptoProvider: "payram",
    pricingMode: "live_quote",
    decimals: 6,
    amountTolerance: "0.01",
    enabled: enabledCurrencyIds.includes("trx"),
    sortOrder: 5,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    payramNetwork: "Tron",
    payramCurrencyCode: "TRX",
    payramStandard: "TRX",
    binanceSymbol: "TRXUSDT",
  },
  usdt_erc20: {
    id: "usdt_erc20",
    label: "USDT (ERC20)",
    chain: "ethereum",
    cryptoProvider: "payram",
    pricingMode: "fiat_peg",
    decimals: 6,
    amountTolerance: "0.01",
    enabled: enabledCurrencyIds.includes("usdt_erc20"),
    sortOrder: 6,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    payramNetwork: "Ethereum",
    payramCurrencyCode: "USDT",
    payramStandard: "ERC20",
  },
  usdt_trc20: {
    id: "usdt_trc20",
    label: "USDT (TRC20)",
    chain: "tron",
    cryptoProvider: "payram",
    pricingMode: "fiat_peg",
    decimals: 6,
    amountTolerance: "0.01",
    enabled: enabledCurrencyIds.includes("usdt_trc20"),
    sortOrder: 7,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    payramNetwork: "Tron",
    payramCurrencyCode: "USDT",
    payramStandard: "TRC20",
  },
  bnb_bsc: {
    id: "bnb_bsc",
    label: "BNB",
    chain: "bsc",
    cryptoProvider: "evm_direct",
    pricingMode: "live_quote",
    decimals: 18,
    amountTolerance: "0.0001",
    enabled: enabledCurrencyIds.includes("bnb_bsc"),
    sortOrder: 8,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    evmChainId: 56,
    evmAssetType: "native",
    evmExplorerBaseUrl: "https://bscscan.com",
    minConfirmations: DEFAULT_EVM_CONFIRMATIONS,
    binanceSymbol: "BNBUSDT",
  },
  usdt_bep20: {
    id: "usdt_bep20",
    label: "USDT (BEP20)",
    chain: "bsc",
    cryptoProvider: "evm_direct",
    pricingMode: "fiat_peg",
    decimals: 18,
    amountTolerance: "0.01",
    enabled: enabledCurrencyIds.includes("usdt_bep20"),
    sortOrder: 9,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    evmChainId: 56,
    evmAssetType: "erc20",
    evmTokenAddress: "0x55d398326f99059fF775485246999027B3197955",
    evmExplorerBaseUrl: "https://bscscan.com",
    minConfirmations: DEFAULT_EVM_CONFIRMATIONS,
  },
}

export function getCryptoCurrencyConfig(currencyId: CryptoCurrencyId) {
  return CRYPTO_CURRENCIES[currencyId]
}

export function getEnabledCryptoCurrencies(availableCurrencyIds?: CryptoCurrencyId[]) {
  return Object.values(CRYPTO_CURRENCIES)
    .filter(
      (currency) =>
        currency.enabled && (!availableCurrencyIds || availableCurrencyIds.includes(currency.id))
    )
    .sort((left, right) => {
      const leftOrder = enabledCurrencyOrder.get(left.id) ?? left.sortOrder
      const rightOrder = enabledCurrencyOrder.get(right.id) ?? right.sortOrder

      return leftOrder - rightOrder
    })
}

export function getDefaultCryptoCurrencyId(availableCurrencyIds?: CryptoCurrencyId[]) {
  return getEnabledCryptoCurrencies(availableCurrencyIds)[0]?.id
}

export function isEnabledCryptoCurrency(currencyId?: string): currencyId is CryptoCurrencyId {
  if (!currencyId) {
    return false
  }

  return getEnabledCryptoCurrencies().some((currency) => currency.id === currencyId)
}
