export type EvmDirectNetwork = "mainnet" | "testnet"

export interface EvmDirectConfig {
  merchantWalletAddress: string
  rpcUrl: string
  fallbackRpcUrl: string
  network: EvmDirectNetwork
  chainId: number
  explorerBaseUrl: string
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

function getBscNetwork(): EvmDirectNetwork {
  return getEnv("BSC_NETWORK") === "testnet" ? "testnet" : "mainnet"
}

function getDefaultChainId(network: EvmDirectNetwork) {
  return network === "testnet" ? 97 : 56
}

function getDefaultExplorerBaseUrl(network: EvmDirectNetwork) {
  return network === "testnet" ? "https://testnet.bscscan.com" : "https://bscscan.com"
}

export function getEvmDirectConfig(): EvmDirectConfig {
  const network = getBscNetwork()

  return {
    merchantWalletAddress: getEnv("EVM_DIRECT_MERCHANT_WALLET") ?? "",
    rpcUrl: getEnv("BSC_RPC_URL") ?? "",
    fallbackRpcUrl: getEnv("BSC_RPC_FALLBACK_URL") ?? "",
    network,
    chainId: getDefaultChainId(network),
    explorerBaseUrl: getDefaultExplorerBaseUrl(network),
  }
}

export function isEvmDirectConfigured() {
  const config = getEvmDirectConfig()
  return Boolean(config.merchantWalletAddress && config.rpcUrl)
}
