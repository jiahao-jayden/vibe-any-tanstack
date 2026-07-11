import { getPayRamConfig } from "./config"
import { CryptoPaymentError } from "./errors"

interface PayRamCreatePaymentParams {
  amount: string
  currency: string
  customerEmail: string
  customerId: string
  successUrl?: string
  cancelUrl?: string
  callbackUrl: string
  metadata: Record<string, string>
}

interface PayRamCurrencyOption {
  code: string
  standard?: string
  network?: string
  customerAddress?: string
  qrPayload?: string
  address?: string
  amount?: string
}

export interface PayRamAssignedPayment {
  providerPaymentId: string
  walletAddress: string
  paymentUrl?: string
  qrPayload?: string
  network: string
  currencyCode: string
  standard?: string
  providerExpiresAt?: string
  payramStatus?: string
}

type PayRamStatusResponse = Record<string, unknown>

async function parseJsonSafe(response: Response) {
  const text = await response.text()
  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return { raw: text }
  }
}

export class PayRamClient {
  private getHeaders() {
    const config = getPayRamConfig()
    return {
      "Content-Type": "application/json",
      "API-Key": config.apiKey,
    }
  }

  private async request(path: string, init?: RequestInit) {
    const config = getPayRamConfig()
    if (!config.apiUrl || !config.apiKey) {
      throw new CryptoPaymentError({
        code: "provider_unavailable",
        statusCode: 503,
        userMessage: "This crypto currency is temporarily unavailable.",
        message: "PayRam API configuration is missing",
      })
    }

    const response = await fetch(`${config.apiUrl}${path}`, {
      ...init,
      headers: {
        ...this.getHeaders(),
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const errorPayload = await parseJsonSafe(response)
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: response.status,
        userMessage: "Failed to create crypto checkout. Please try again.",
        message: `PayRam API error at ${path}`,
        context: errorPayload,
      })
    }

    return parseJsonSafe(response)
  }

  async createAssignedPayment(params: {
    amount: string
    currency: string
    standard?: string
    network: string
    customerEmail: string
    customerId: string
    successUrl?: string
    cancelUrl?: string
    callbackUrl: string
    metadata: Record<string, string>
  }): Promise<PayRamAssignedPayment> {
    const payment = await this.createPayment({
      amount: params.amount,
      currency: "USD",
      customerEmail: params.customerEmail,
      customerId: params.customerId,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      callbackUrl: params.callbackUrl,
      metadata: params.metadata,
    })

    const options = await this.getBlockchainCurrencies(payment.providerPaymentId)
    const matchedCurrency = this.findCurrencyOption(options, {
      network: params.network,
      currency: params.currency,
      standard: params.standard,
    })

    const assignedCurrency = matchedCurrency.customerAddress
      ? matchedCurrency
      : await this.assignDepositAddress(payment.providerPaymentId, {
          network: params.network,
          currency: params.currency,
          standard: params.standard,
        })

    const walletAddress =
      assignedCurrency.customerAddress ??
      assignedCurrency.address ??
      matchedCurrency.customerAddress ??
      matchedCurrency.address

    if (!walletAddress) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 502,
        userMessage: "Failed to create crypto checkout. Please try again.",
        message: `PayRam did not return a deposit address for ${params.currency}/${params.network}`,
      })
    }

    return {
      providerPaymentId: payment.providerPaymentId,
      walletAddress,
      paymentUrl: payment.paymentUrl,
      qrPayload:
        assignedCurrency.qrPayload ??
        assignedCurrency.address ??
        matchedCurrency.qrPayload ??
        matchedCurrency.address,
      network: params.network,
      currencyCode: params.currency,
      standard: params.standard,
      providerExpiresAt: payment.providerExpiresAt,
      payramStatus: payment.status,
    }
  }

  async createPayment(params: PayRamCreatePaymentParams) {
    const payload = await this.request("/api/v1/payment", {
      method: "POST",
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        customerEmail: params.customerEmail,
        customerID: params.customerId,
        redirectUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        callbackUrl: params.callbackUrl,
        metadata: params.metadata,
      }),
    })

    const providerPaymentId = this.pickString(payload, [
      "reference_id",
      "referenceId",
      "payment_id",
      "paymentId",
      "id",
    ])

    if (!providerPaymentId) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 502,
        userMessage: "Failed to create crypto checkout. Please try again.",
        message: "PayRam create payment response is missing providerPaymentId",
        context: payload,
      })
    }

    return {
      providerPaymentId,
      paymentUrl: this.pickString(payload, ["url", "payment_url", "paymentUrl", "hosted_url"]),
      providerExpiresAt: this.pickString(payload, [
        "expired_at",
        "expires_at",
        "providerExpiresAt",
        "expiry",
      ]),
      status: this.pickString(payload, ["status"]),
    }
  }

  async getBlockchainCurrencies(referenceId: string) {
    const payload = await this.request(`/api/v1/payment/${referenceId}/currencies`, {
      method: "GET",
    })

    const candidates = [
      payload.data,
      payload.currencies,
      payload.result,
      payload.items,
      Array.isArray(payload) ? payload : undefined,
    ].find(Array.isArray)

    return (candidates ?? []) as PayRamCurrencyOption[]
  }

  async assignDepositAddress(
    referenceId: string,
    selection: { network: string; currency: string; standard?: string }
  ) {
    const payload = await this.request(`/api/v1/payment/${referenceId}/assign-address`, {
      method: "POST",
      body: JSON.stringify({
        network: selection.network,
        currency: selection.currency,
        standard: selection.standard,
      }),
    })

    return {
      customerAddress: this.pickString(payload, ["customerAddress", "address", "depositAddress"]),
      qrPayload: this.pickString(payload, ["qrPayload", "qr_payload", "paymentUri"]),
      address: this.pickString(payload, ["address", "depositAddress"]),
      amount: this.pickString(payload, ["amount", "cryptoAmount"]),
    }
  }

  async getPaymentStatus(referenceId: string): Promise<PayRamStatusResponse> {
    return this.request(`/api/v1/payment/reference/${referenceId}`, { method: "GET" })
  }

  private findCurrencyOption(
    options: PayRamCurrencyOption[],
    selection: { network: string; currency: string; standard?: string }
  ) {
    const normalizedCurrency = selection.currency.toUpperCase()
    const normalizedNetwork = selection.network.toLowerCase()
    const normalizedStandard = selection.standard?.toUpperCase()

    const matched = options.find((option) => {
      const optionCode = option.code?.toUpperCase()
      const optionNetwork = option.network?.toLowerCase()
      const optionStandard = option.standard?.toUpperCase()

      return (
        optionCode === normalizedCurrency &&
        (!optionNetwork || optionNetwork === normalizedNetwork) &&
        (!normalizedStandard || !optionStandard || optionStandard === normalizedStandard)
      )
    })

    if (!matched) {
      throw new CryptoPaymentError({
        code: "invalid_crypto_currency",
        statusCode: 400,
        userMessage: "The selected crypto currency is invalid.",
        message: `PayRam currency option not found for ${selection.currency}/${selection.network}/${selection.standard ?? "native"}`,
      })
    }

    return matched
  }

  private pickString(payload: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = payload[key]
      if (typeof value === "string" && value.length > 0) {
        return value
      }
    }

    return undefined
  }
}

export const payRamClient = new PayRamClient()
