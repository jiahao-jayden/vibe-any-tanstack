import { Keypair } from "@solana/web3.js"
import { eq } from "drizzle-orm"
import type { DbTransaction } from "@/db"
import { order } from "@/db/order.schema"
import type { ResolvedCryptoPrice, SolanaCryptoOrderMetadata } from "@/shared/types/crypto"
import type { CryptoCurrencyConfig } from "../currencies"
import { CryptoPaymentError } from "../errors"
import { serializeCryptoOrderMetadata } from "../order-metadata"
import { solanaPayUrlBuilder } from "../solanapay-url-builder"

interface CreateSolanaCheckoutParams {
  tx: DbTransaction
  orderId: string
  planId: string
  priceId: string
  planName: string
  walletAddress: string
  network: string
  cryptoCurrency: CryptoCurrencyConfig["id"]
  currencyConfig: CryptoCurrencyConfig
  resolvedPrice: ResolvedCryptoPrice
}

export class SolanaPayProvider {
  createDraftMetadata(params: Omit<CreateSolanaCheckoutParams, "tx" | "orderId" | "planName">) {
    const referenceKey = Keypair.generate().publicKey.toBase58()

    return {
      paymentMethod: "crypto" as const,
      cryptoProvider: "solanapay" as const,
      cryptoCurrency: params.cryptoCurrency,
      referenceKey,
      detailedStatus: "waiting_payment" as const,
      checkoutExpiresAt: new Date(
        Date.now() + params.currencyConfig.checkoutTimeout * 1000
      ).toISOString(),
      cryptoAmount: params.resolvedPrice.cryptoAmount,
      fiatAmount: params.resolvedPrice.fiatAmount,
      fiatCurrency: params.resolvedPrice.fiatCurrency,
      walletAddress: params.walletAddress,
      network: params.network,
      memo: "",
      planId: params.planId,
      priceId: params.priceId,
      solanaPayUrl: "",
      ...(params.resolvedPrice.quoteSource ? { quoteSource: params.resolvedPrice.quoteSource } : {}),
      ...(params.resolvedPrice.quoteRate ? { quoteRate: params.resolvedPrice.quoteRate } : {}),
      ...(params.resolvedPrice.quotedAt ? { quotedAt: params.resolvedPrice.quotedAt } : {}),
      ...(params.resolvedPrice.quoteExpiresAt
        ? { quoteExpiresAt: params.resolvedPrice.quoteExpiresAt }
        : {}),
      ...(params.resolvedPrice.interval ? { priceInterval: params.resolvedPrice.interval } : {}),
      ...(params.currencyConfig.tokenMint ? { tokenMint: params.currencyConfig.tokenMint } : {}),
    } satisfies SolanaCryptoOrderMetadata
  }

  async finalizeCheckout(params: CreateSolanaCheckoutParams & { metadata: SolanaCryptoOrderMetadata }) {
    const memo = `vibeany:order:${params.orderId}`
    const solanaPayUrl = solanaPayUrlBuilder.build({
      recipient: params.walletAddress,
      amount: params.resolvedPrice.cryptoAmount,
      referenceKey: params.metadata.referenceKey,
      memo,
      label: "VibeAny",
      message: `Payment for ${params.planName}`,
      tokenMint: params.currencyConfig.tokenMint,
    })

    const finalMetadata: SolanaCryptoOrderMetadata = {
      ...params.metadata,
      memo,
      solanaPayUrl,
    }

    const [updatedOrder] = await params.tx
      .update(order)
      .set({
        metadata: serializeCryptoOrderMetadata(finalMetadata),
        updatedAt: new Date(),
      })
      .where(eq(order.id, params.orderId))
      .returning()

    if (!updatedOrder) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "Failed to create crypto checkout. Please try again.",
        orderId: params.orderId,
        message: `Failed to persist Solana Pay checkout metadata: ${params.orderId}`,
      })
    }

    return updatedOrder
  }
}

export const solanaPayProvider = new SolanaPayProvider()
