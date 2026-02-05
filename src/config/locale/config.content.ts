import { type Dictionary, t } from "intlayer"

export default {
  key: "admin-config",
  content: {
    mailProvider: {
      label: t({ zh: "邮件服务商", en: "Mail Provider" }),
      description: t({ zh: "用于发送邮件的服务", en: "Service for sending emails" }),
    },
    mailProviderResend: {
      label: t({ zh: "Resend", en: "Resend" }),
    },
    mailProviderCustom: {
      label: t({ zh: "自定义 SMTP", en: "Custom SMTP" }),
    },
    mailFrom: {
      label: t({ zh: "发件邮箱", en: "From Email" }),
      description: t({
        zh: "用于发送邮件的邮箱 (VibeAny <noreply@auth.vibeany.dev>)",
        en: "Email for sending emails",
      }),
    },
    resendApiKey: {
      label: t({ zh: "Resend API Key", en: "Resend API Key" }),
      description: t({
        zh: "用于发送邮件的 API Key (https://resend.com/api-keys)",
        en: "API Key for sending emails (https://resend.com/api-keys)",
      }),
    },
    paymentProvider: {
      label: t({ zh: "支付服务商", en: "Payment Provider" }),
      description: t({ zh: "用于支付的服务", en: "Service for payment" }),
    },
    paymentProviderStripe: {
      label: t({ zh: "Stripe", en: "Stripe" }),
    },
    paymentProviderCreem: {
      label: t({ zh: "Creem", en: "Creem" }),
    },
    paymentProviderPaypal: {
      label: t({ zh: "PayPal", en: "PayPal" }),
    },
    paymentProviderWechat: {
      label: t({ zh: "微信支付", en: "WeChat Pay" }),
    },
    paymentProviderAlipay: {
      label: t({ zh: "支付宝", en: "Alipay" }),
    },
    paymentStripePublishableKey: {
      label: t({ zh: "Stripe Publishable Key", en: "Stripe Publishable Key" }),
      description: t({ zh: "用于支付的 Publishable Key", en: "Publishable Key for payment" }),
    },
    paymentStripeSecretKey: {
      label: t({ zh: "Stripe Secret Key", en: "Stripe Secret Key" }),
      description: t({ zh: "用于支付的 Secret Key", en: "Secret Key for payment" }),
    },
    paymentStripeWebhookSecret: {
      label: t({ zh: "Stripe Webhook Secret", en: "Stripe Webhook Secret" }),
      description: t({ zh: "用于支付的 Webhook Secret", en: "Webhook Secret for payment" }),
    },
    paymentCreemXApiKey: {
      label: t({ zh: "Creem X API Key", en: "Creem X API Key" }),
      description: t({ zh: "用于支付的 X API Key", en: "X API Key for payment" }),
    },
    paymentCreemTestMode: {
      label: t({ zh: "Creem Test Mode", en: "Creem Test Mode" }),
      description: t({ zh: "用于支付的测试模式", en: "Test mode for payment" }),
    },
    paymentCreemWebhookSecret: {
      label: t({ zh: "Creem Webhook Secret", en: "Creem Webhook Secret" }),
      description: t({ zh: "用于支付的 Webhook Secret", en: "Webhook Secret for payment" }),
    },
    // PayPal
    paymentPaypalClientId: {
      label: t({ zh: "PayPal Client ID", en: "PayPal Client ID" }),
      description: t({ zh: "PayPal 应用客户端 ID", en: "PayPal application client ID" }),
    },
    paymentPaypalClientSecret: {
      label: t({ zh: "PayPal Client Secret", en: "PayPal Client Secret" }),
      description: t({ zh: "PayPal 应用客户端密钥", en: "PayPal application client secret" }),
    },
    paymentPaypalWebhookId: {
      label: t({ zh: "PayPal Webhook ID", en: "PayPal Webhook ID" }),
      description: t({ zh: "PayPal Webhook ID", en: "PayPal Webhook ID" }),
    },
    paymentPaypalSandbox: {
      label: t({ zh: "PayPal 沙盒模式", en: "PayPal Sandbox Mode" }),
      description: t({
        zh: "是否使用 PayPal 沙盒环境",
        en: "Whether to use PayPal sandbox environment",
      }),
    },
    // WeChat Pay
    paymentWechatAppId: {
      label: t({ zh: "微信 App ID", en: "WeChat App ID" }),
      description: t({ zh: "微信支付应用 ID", en: "WeChat Pay application ID" }),
    },
    paymentWechatMchId: {
      label: t({ zh: "微信商户号", en: "WeChat Merchant ID" }),
      description: t({ zh: "微信支付商户号", en: "WeChat Pay merchant ID" }),
    },
    paymentWechatApiKey: {
      label: t({ zh: "微信 API 密钥", en: "WeChat API Key" }),
      description: t({ zh: "微信支付 API 密钥", en: "WeChat Pay API key" }),
    },
    paymentWechatApiV3Key: {
      label: t({ zh: "微信 API v3 密钥", en: "WeChat API v3 Key" }),
      description: t({ zh: "微信支付 API v3 密钥", en: "WeChat Pay API v3 key" }),
    },
    paymentWechatSerialNo: {
      label: t({ zh: "微信证书序列号", en: "WeChat Certificate Serial No" }),
      description: t({ zh: "微信支付证书序列号", en: "WeChat Pay certificate serial number" }),
    },
    paymentWechatPrivateKey: {
      label: t({ zh: "微信私钥", en: "WeChat Private Key" }),
      description: t({ zh: "微信支付 API 私钥", en: "WeChat Pay API private key" }),
    },
    // Alipay
    paymentAlipayAppId: {
      label: t({ zh: "支付宝 App ID", en: "Alipay App ID" }),
      description: t({ zh: "支付宝应用 ID", en: "Alipay application ID" }),
    },
    paymentAlipayPrivateKey: {
      label: t({ zh: "支付宝应用私钥", en: "Alipay Private Key" }),
      description: t({ zh: "支付宝应用私钥", en: "Alipay application private key" }),
    },
    paymentAlipayPublicKey: {
      label: t({ zh: "支付宝公钥", en: "Alipay Public Key" }),
      description: t({ zh: "支付宝公钥", en: "Alipay public key" }),
    },
    paymentAlipaySandbox: {
      label: t({ zh: "支付宝沙盒模式", en: "Alipay Sandbox Mode" }),
      description: t({
        zh: "是否使用支付宝沙盒环境",
        en: "Whether to use Alipay sandbox environment",
      }),
    },
    creditEnable: {
      label: t({ zh: "启用积分系统", en: "Enable Credit System" }),
      description: t({ zh: "是否启用积分功能", en: "Whether to enable credit functionality" }),
    },
    creditAllowFreeUserPurchase: {
      label: t({ zh: "允许免费用户购买", en: "Allow Free User Purchase" }),
      description: t({
        zh: "是否允许免费用户购买积分包",
        en: "Whether to allow free users to purchase credit packages",
      }),
    },
    creditSignupBonusEnabled: {
      label: t({ zh: "启用注册赠送", en: "Enable Signup Bonus" }),
      description: t({
        zh: "新用户注册时是否赠送积分",
        en: "Whether to grant credits when new users sign up",
      }),
    },
    creditSignupBonusAmount: {
      label: t({ zh: "注册赠送数量", en: "Signup Bonus Amount" }),
      description: t({
        zh: "新用户注册时赠送的积分数量",
        en: "Number of credits granted to new users on signup",
      }),
    },
    creditSignupBonusExpireDays: {
      label: t({ zh: "赠送积分有效期", en: "Signup Bonus Validity" }),
      description: t({
        zh: "注册赠送积分的有效天数",
        en: "Number of days signup bonus credits are valid",
      }),
    },
    creditDailyEnabled: {
      label: t({ zh: "启用每日赠送", en: "Enable Daily Bonus" }),
      description: t({
        zh: "是否启用每日赠送积分",
        en: "Whether to enable daily bonus credits",
      }),
    },
    creditDailyAmount: {
      label: t({ zh: "每日赠送积分数量", en: "Daily Bonus Amount" }),
      description: t({
        zh: "每日赠送积分数量",
        en: "Daily bonus credits amount",
      }),
    },
    creditDailyRefreshHour: {
      label: t({ zh: "每日赠送积分刷新时间", en: "Daily Bonus Refresh Hour" }),
      description: t({
        zh: "每日赠送积分刷新时间",
        en: "Daily bonus credits refresh hour",
      }),
    },
    // Storage
    storageRegion: {
      label: t({ zh: "存储区域", en: "Storage Region" }),
      description: t({
        zh: "S3 兼容存储的区域，Cloudflare R2 使用 auto",
        en: "Region for S3 compatible storage, use auto for Cloudflare R2",
      }),
    },
    storageBucketName: {
      label: t({ zh: "存储桶名称", en: "Bucket Name" }),
      description: t({
        zh: "S3 兼容存储的存储桶名称",
        en: "Bucket name for S3 compatible storage",
      }),
    },
    storageAccessKeyId: {
      label: t({ zh: "Access Key ID", en: "Access Key ID" }),
      description: t({
        zh: "S3 兼容存储的访问密钥 ID",
        en: "Access key ID for S3 compatible storage",
      }),
    },
    storageSecretAccessKey: {
      label: t({ zh: "Secret Access Key", en: "Secret Access Key" }),
      description: t({
        zh: "S3 兼容存储的访问密钥",
        en: "Secret access key for S3 compatible storage",
      }),
    },
    storageEndpoint: {
      label: t({ zh: "存储端点", en: "Storage Endpoint" }),
      description: t({
        zh: "S3 兼容存储的端点 URL，如 https://xxx.r2.cloudflarestorage.com",
        en: "Endpoint URL for S3 compatible storage, e.g. https://xxx.r2.cloudflarestorage.com",
      }),
    },
    storagePublicUrl: {
      label: t({ zh: "公开访问 URL", en: "Public URL" }),
      description: t({
        zh: "用于公开访问文件的自定义域名，如 https://cdn.example.com",
        en: "Custom domain for public file access, e.g. https://cdn.example.com",
      }),
    },
    groups: {
      storage: {
        title: t({ zh: "存储设置", en: "Storage Settings" }),
        description: t({
          zh: "S3 兼容存储服务配置",
          en: "S3 compatible storage service configuration",
        }),
      },
      mail: {
        title: t({ zh: "邮件设置", en: "Mail Settings" }),
        description: t({ zh: "邮件服务配置", en: "Mail service configuration" }),
      },
      payment: {
        title: t({ zh: "支付设置", en: "Payment Settings" }),
        description: t({ zh: "支付服务配置", en: "Payment service configuration" }),
      },
      credit: {
        title: t({ zh: "积分设置", en: "Credit Settings" }),
        description: t({ zh: "积分系统配置", en: "Credit system configuration" }),
      },
    },
    subGroups: {
      paymentStripe: {
        title: t({ zh: "Stripe 配置", en: "Stripe Configuration" }),
      },
      paymentCreem: {
        title: t({ zh: "Creem 配置", en: "Creem Configuration" }),
      },
      paymentPaypal: {
        title: t({ zh: "PayPal 配置", en: "PayPal Configuration" }),
      },
      paymentWechat: {
        title: t({ zh: "微信支付配置", en: "WeChat Pay Configuration" }),
      },
      paymentAlipay: {
        title: t({ zh: "支付宝配置", en: "Alipay Configuration" }),
      },
      creditBasic: {
        title: t({ zh: "基本设置", en: "Basic Settings" }),
      },
      creditSignupBonus: {
        title: t({ zh: "注册赠送", en: "Signup Bonus" }),
      },
      creditDaily: {
        title: t({ zh: "每日赠送", en: "Daily Bonus" }),
      },
    },
  },
} satisfies Dictionary
