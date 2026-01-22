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
    groups: {
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
      creditBasic: {
        title: t({ zh: "基本设置", en: "Basic Settings" }),
      },
      creditSignupBonus: {
        title: t({ zh: "注册赠送", en: "Signup Bonus" }),
      },
    },
  },
} satisfies Dictionary
