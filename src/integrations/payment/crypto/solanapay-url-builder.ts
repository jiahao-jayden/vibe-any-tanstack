import { encodeURL } from "@solana/pay"
import { PublicKey } from "@solana/web3.js"
import BigNumber from "bignumber.js"
import { getSolanaPayNetwork } from "./config"
import { CryptoPaymentError } from "./errors"

export interface BuildSolanaPayUrlParams {
  recipient: string
  amount: string
  referenceKey: string
  memo: string
  label: string
  message: string
  tokenMint?: string
}

export class SolanaPayUrlBuilder {
  build(params: BuildSolanaPayUrlParams) {
    const { recipient, amount, referenceKey, memo, label, message, tokenMint } = params

    let recipientKey: PublicKey
    try {
      recipientKey = new PublicKey(recipient)
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Unknown recipient wallet address error"
      throw new CryptoPaymentError({
        code: "invalid_wallet_address",
        statusCode: 500,
        userMessage: "Crypto checkout configuration is invalid.",
        message: `Invalid Solana Pay recipient wallet address: ${messageText}`,
        context: { recipient },
      })
    }

    let reference: PublicKey
    try {
      reference = new PublicKey(referenceKey)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Unknown reference key error"
      throw new CryptoPaymentError({
        code: "invalid_reference",
        statusCode: 500,
        userMessage: "Crypto checkout configuration is invalid.",
        message: `Invalid Solana Pay reference key: ${messageText}`,
        context: { referenceKey },
      })
    }

    try {
      const transferAmount = new BigNumber(amount) as any

      const url = encodeURL({
        recipient: recipientKey,
        amount: transferAmount,
        reference,
        label,
        message,
        memo,
        splToken: tokenMint ? new PublicKey(tokenMint) : undefined,
      })

      return url.toString()
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Unknown Solana Pay URL error"
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "Crypto checkout configuration is invalid.",
        message: `Failed to build Solana Pay URL: ${messageText}`,
        context: { recipient, referenceKey, tokenMint },
      })
    }
  }

  getExplorerUrl(signature: string) {
    const network = getSolanaPayNetwork()
    const clusterQuery = network === "mainnet-beta" ? "" : `?cluster=${network}`
    return `https://solscan.io/tx/${signature}${clusterQuery}`
  }
}

export const solanaPayUrlBuilder = new SolanaPayUrlBuilder()
