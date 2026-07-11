import { findOrderById } from "@/shared/model/order.model"
import { CryptoPaymentError } from "./errors"
import { evmPaymentVerifier } from "./evm-payment-verifier"
import { buildCryptoCheckoutData, getCryptoOrderMetadata } from "./order-metadata"
import { solanaPaymentVerifier } from "./solana-payment-verifier"

export class CryptoStatusResolver {
  async resolve(orderId: string) {
    const currentOrder = await findOrderById(orderId)
    if (!currentOrder) {
      throw new CryptoPaymentError({
        code: "payment_not_found",
        statusCode: 404,
        userMessage: "Crypto payment record was not found.",
        orderId,
        message: `Order not found: ${orderId}`,
      })
    }

    const metadata = getCryptoOrderMetadata(currentOrder)
    if (!metadata) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 400,
        userMessage: "We could not validate this crypto payment.",
        orderId,
        message: `Order is not a crypto checkout: ${orderId}`,
      })
    }

    const shouldRefresh =
      currentOrder.status === "pending" &&
      (metadata.detailedStatus === "waiting_payment" || metadata.detailedStatus === "confirming")

    if (!shouldRefresh) {
      return buildCryptoCheckoutData(currentOrder)
    }

    if (metadata.cryptoProvider === "solanapay") {
      return solanaPaymentVerifier.verifyPayment(orderId)
    }

    if (metadata.cryptoProvider === "evm_direct" && metadata.submittedTxHash) {
      return evmPaymentVerifier.verifyPayment(orderId)
    }

    return buildCryptoCheckoutData(currentOrder)
  }
}

export const cryptoStatusResolver = new CryptoStatusResolver()
