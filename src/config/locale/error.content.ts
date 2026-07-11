import { type Dictionary, t } from "intlayer"

export default {
  key: "error",
  content: {
    UNAUTHORIZED: t({ en: "Please login first", zh: "请先登录" }),
    FORBIDDEN: t({ en: "Access denied", zh: "访问被拒绝" }),
    NOT_FOUND: t({ en: "Resource not found", zh: "资源不存在" }),
    VALIDATION_FAILED: t({ en: "Invalid data", zh: "数据无效" }),
    NETWORK_ERROR: t({ en: "Network error, please try again", zh: "网络错误，请稍后重试" }),
    crypto_disabled: t({
      en: "Crypto payments are currently unavailable",
      zh: "当前暂不支持加密货币支付",
    }),
    invalid_crypto_currency: t({
      en: "The selected crypto currency is invalid",
      zh: "所选加密货币无效",
    }),
    crypto_price_not_configured: t({
      en: "This crypto price is not available for the selected plan",
      zh: "当前方案未配置该加密货币价格",
    }),
    crypto_quote_unavailable: t({
      en: "Live crypto pricing is temporarily unavailable",
      zh: "暂时无法获取实时加密货币报价",
    }),
    crypto_quote_timeout: t({
      en: "Live crypto pricing timed out, please try again",
      zh: "实时加密货币报价超时，请稍后重试",
    }),
    crypto_quote_invalid: t({
      en: "Received an invalid live crypto quote",
      zh: "收到的实时加密货币报价无效",
    }),
    wallet_not_configured: t({
      en: "Crypto checkout is temporarily unavailable",
      zh: "加密货币支付暂时不可用",
    }),
    invalid_wallet_address: t({
      en: "Crypto checkout configuration is invalid",
      zh: "加密货币支付配置无效",
    }),
    invalid_reference: t({
      en: "Crypto checkout reference is invalid",
      zh: "加密货币支付参考标识无效",
    }),
    checkout_expired: t({
      en: "This crypto checkout has expired",
      zh: "当前加密货币支付单已过期",
    }),
    payment_not_found: t({
      en: "Crypto payment record was not found",
      zh: "未找到加密货币支付记录",
    }),
    payment_already_processed: t({
      en: "This crypto payment has already been processed",
      zh: "该加密货币支付已处理",
    }),
    payment_underpaid: t({
      en: "The transferred amount is below the required amount",
      zh: "实际转账金额低于应付金额",
    }),
    payment_overpaid: t({
      en: "The transferred amount is above the required amount",
      zh: "实际转账金额高于应付金额",
    }),
    payment_late: t({
      en: "The payment arrived after the checkout expired",
      zh: "付款到账时间晚于支付单过期时间",
    }),
    payment_duplicate: t({
      en: "This blockchain transaction is already linked elsewhere",
      zh: "该链上交易已关联到其他支付记录",
    }),
    payment_amount_mismatch: t({
      en: "The transferred amount does not match the checkout amount",
      zh: "实际转账金额与支付单金额不匹配",
    }),
    payment_rate_limited: t({
      en: "Too many transaction-hash submissions. Please wait a moment and try again.",
      zh: "交易哈希提交过于频繁，请稍后再试。",
    }),
    payment_validation_failed: t({
      en: "We could not validate this crypto payment",
      zh: "当前无法完成加密货币支付验证",
    }),
    payment_review_required: t({
      en: "This crypto payment requires manual review",
      zh: "该加密货币支付需要人工审核",
    }),
    provider_unavailable: t({
      en: "This crypto currency is temporarily unavailable",
      zh: "当前加密货币暂时不可用",
    }),
    webhook_signature_invalid: t({
      en: "Invalid webhook signature",
      zh: "Webhook 签名无效",
    }),
    provider_mapping_invalid: t({
      en: "The selected crypto currency is invalid",
      zh: "所选加密货币无效",
    }),
    invalid_tx_hash: t({
      en: "The submitted transaction hash is invalid",
      zh: "提交的交易哈希无效",
    }),
    wrong_network: t({
      en: "This transaction belongs to a different network",
      zh: "这笔交易属于错误的网络",
    }),
    transaction_failed: t({
      en: "This transaction failed on-chain",
      zh: "这笔交易在链上执行失败",
    }),
    transaction_too_old: t({
      en: "This transaction predates the checkout and cannot be used",
      zh: "这笔交易早于当前支付单，不能用于本次付款",
    }),
    wrong_asset: t({
      en: "This transaction does not match the expected asset",
      zh: "这笔交易的资产类型与当前支付单不匹配",
    }),
    wrong_recipient: t({
      en: "This transaction does not pay the configured recipient wallet",
      zh: "这笔交易没有支付到当前配置的收款钱包",
    }),
    rpc_unavailable: t({
      en: "We could not verify this blockchain transaction right now",
      zh: "暂时无法验证这笔链上交易",
    }),
    UNKNOWN_ERROR: t({ en: "Something went wrong", zh: "发生未知错误" }),
  },
} satisfies Dictionary
