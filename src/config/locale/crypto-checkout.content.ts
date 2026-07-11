import { type Dictionary, t } from "intlayer"

export default {
  key: "crypto-checkout",
  content: {
    title: t({ en: "Crypto Checkout", zh: "加密货币支付" }),
    subtitle: t({
      en: "Follow the payment instructions for the selected network, then keep this page open while we verify the transfer.",
      zh: "请按当前网络的支付指引完成转账，并在验证期间保持当前页面打开。",
    }),
    amountLabel: t({ en: "Amount", zh: "支付金额" }),
    fiatLabel: t({ en: "Fiat equivalent", zh: "法币等值" }),
    cryptoCurrencyLabel: t({ en: "Asset", zh: "币种" }),
    addressLabel: t({ en: "Recipient", zh: "收款地址" }),
    referenceLabel: t({ en: "Reference", zh: "参考标识" }),
    expiresLabel: t({ en: "Time left", zh: "剩余时间" }),
    networkLabel: t({ en: "Network", zh: "网络" }),
    memoLabel: t({ en: "Memo", zh: "备注" }),
    estimatedConfirmLabel: t({ en: "Estimated confirmation", zh: "预计确认时间" }),
    statusWaiting: t({ en: "Waiting for payment", zh: "等待付款" }),
    statusConfirming: t({ en: "Confirming on-chain", zh: "链上确认中" }),
    statusPaid: t({ en: "Payment received", zh: "已收到付款" }),
    loadingCheckout: t({ en: "Loading checkout", zh: "正在加载支付信息" }),
    statusExpired: t({ en: "Checkout expired", zh: "支付已过期" }),
    statusReview: t({ en: "Manual review required", zh: "需要人工审核" }),
    paidDescription: t({
      en: "Your transfer has been received. We will redirect you to billing shortly.",
      zh: "系统已收到本次转账，即将为你跳转到订阅管理页面。",
    }),
    expiredDescription: t({
      en: "This checkout has expired. Create a new checkout before sending funds.",
      zh: "当前支付单已过期，请重新创建新的支付单后再付款。",
    }),
    reviewDescription: t({
      en: "We detected an issue with this payment and it needs manual review before fulfillment.",
      zh: "系统检测到本次付款存在异常，需人工审核后才能完成履约。",
    }),
    networkCongestionTitle: t({
      en: "Network congestion detected",
      zh: "检测到链上网络拥堵",
    }),
    networkCongestionDescription: t({
      en: "If your wallet already shows the transfer as sent, Solana may be congested. Keep this page open and we will continue polling.",
      zh: "如果你的钱包已经显示转账已发送，可能是 Solana 网络拥堵导致确认变慢。请保持当前页面打开，系统会继续轮询。",
    }),
    backToPricing: t({ en: "Back to pricing", zh: "返回定价页" }),
    retry: t({ en: "Create new checkout", zh: "重新创建支付" }),
    copyAddress: t({ en: "Copy address", zh: "复制地址" }),
    copyUrl: t({ en: "Copy payment URL", zh: "复制支付链接" }),
    copied: t({ en: "Copied", zh: "已复制" }),
    switchCurrency: t({ en: "Switch currency", zh: "切换币种" }),
    irreversible: t({
      en: "Crypto transfers are irreversible. Double-check the amount, network, and wallet before sending.",
      zh: "加密货币转账不可逆，请在付款前再次确认金额、网络和钱包地址。",
    }),
    noRefund: t({
      en: "Automatic refunds are not available. Incorrect payments may require manual review.",
      zh: "暂不支持自动退款，异常金额可能需要人工处理。",
    }),
    payramFeeNotice: t({
      en: "Network gas and provider fees may apply on PayRam-backed networks. Please make sure your wallet balance covers them before sending.",
      zh: "PayRam 支持的网络可能会产生链上 Gas 与服务费，请先确认钱包余额足以覆盖这些费用。",
    }),
    openHostedPage: t({ en: "Open hosted payment page", zh: "打开托管支付页" }),
    evmTxHashLabel: t({ en: "Transaction hash", zh: "交易哈希" }),
    evmTxHashPlaceholder: t({
      en: "Paste your transaction hash",
      zh: "粘贴你的交易哈希",
    }),
    evmTxHashHelpNative: t({
      en: "Send exactly BNB on BNB Smart Chain, then paste the final transaction hash here.",
      zh: "请在 BNB Smart Chain 上支付准确的 BNB 金额，完成后把最终交易哈希粘贴到这里。",
    }),
    evmTxHashHelpToken: t({
      en: "Send USDT on BNB Smart Chain using the token contract shown above, then paste the final transaction hash here.",
      zh: "请在 BNB Smart Chain 上按上方代币合约发送 USDT，完成后把最终交易哈希粘贴到这里。",
    }),
    evmSubmitTx: t({ en: "Submit transaction hash", zh: "提交交易哈希" }),
    evmConfirmProgress: t({ en: "Confirmations", zh: "确认进度" }),
    explorer: t({ en: "View transaction", zh: "查看交易" }),
    evmErrorInvalidTxHash: t({
      en: "Enter a valid transaction hash from BscScan or your wallet.",
      zh: "请输入来自 BscScan 或钱包记录的有效交易哈希。",
    }),
    evmErrorWrongNetwork: t({
      en: "This transaction was sent on the wrong network. Use BNB Smart Chain.",
      zh: "这笔交易发送到了错误的网络，请使用 BNB Smart Chain。",
    }),
    evmErrorWrongAsset: t({
      en: "This transaction does not match the expected asset. Check whether you sent BNB or USDT (BEP20).",
      zh: "这笔交易的资产类型不匹配，请确认你发送的是 BNB 或 USDT（BEP20）。",
    }),
    evmErrorWrongRecipient: t({
      en: "This transaction did not send funds to the checkout wallet. Verify the recipient address and try again.",
      zh: "这笔交易没有把资金发送到当前收款钱包，请核对收款地址后再试。",
    }),
    evmErrorAmountMismatch: t({
      en: "The transferred amount does not match this checkout. Verify the exact amount and submit the correct transaction.",
      zh: "实际转账金额与当前支付单不匹配，请核对准确金额后再提交正确交易。",
    }),
    evmErrorTransactionFailed: t({
      en: "This transaction failed on-chain. Please send a new transfer and submit the new hash.",
      zh: "这笔交易在链上执行失败，请重新发起转账并提交新的交易哈希。",
    }),
    evmErrorRpcUnavailable: t({
      en: "We could not verify this transaction right now. Please wait a moment and try again.",
      zh: "暂时无法验证这笔交易，请稍等片刻后再试。",
    }),
    genericError: t({
      en: "Failed to load the crypto checkout. Please try again.",
      zh: "加载加密货币支付页失败，请稍后重试。",
    }),
  },
} satisfies Dictionary
