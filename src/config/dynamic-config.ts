import { z } from "zod"
import {
  createConfigResolver,
  defineConfig,
  defineGroup,
  defineSubGroup,
} from "@/shared/lib/config/helper"

export type PublicConfig = Pick<
  ConfigValues,
  | "public_payment_provider"
  | "public_credit_enable"
  | "public_credit_allow_free_user_purchase"
  | "public_credit_signup_bonus_enabled"
  | "public_credit_signup_bonus_amount"
  | "public_credit_signup_bonus_expire_days"
  | "public_credit_daily_enabled"
  | "public_credit_daily_amount"
>

export const configSchema = defineConfig({
  public_payment_provider: {
    type: "select",
    default: "stripe",
    env: "VITE_PAYMENT_PROVIDER",
    labelKey: "paymentProvider",
    descriptionKey: "paymentProvider",
    options: [
      { value: "stripe" },
      { value: "creem" },
      { value: "paypal" },
      { value: "wechat" },
      { value: "alipay" },
    ],
  },
  // Stripe
  payment_stripe_publishable_key: {
    type: "string",
    default: "",
    env: "VITE_STRIPE_PUBLISHABLE_KEY",
    labelKey: "paymentStripePublishableKey",
    descriptionKey: "paymentStripePublishableKey",
  },
  payment_stripe_secret_key: {
    type: "string",
    default: "",
    env: "STRIPE_SECRET_KEY",
    labelKey: "paymentStripeSecretKey",
    descriptionKey: "paymentStripeSecretKey",
  },
  payment_stripe_webhook_secret: {
    type: "string",
    default: "",
    env: "STRIPE_WEBHOOK_SECRET",
    labelKey: "paymentStripeWebhookSecret",
    descriptionKey: "paymentStripeWebhookSecret",
  },
  // Creem
  payment_creem_x_api_key: {
    type: "string",
    default: "",
    env: "CREEM_X_API_KEY",
    labelKey: "paymentCreemXApiKey",
    descriptionKey: "paymentCreemXApiKey",
  },
  payment_creem_test_mode: {
    type: "boolean",
    default: true,
    env: "CREEM_TEST_MODE",
    labelKey: "paymentCreemTestMode",
    descriptionKey: "paymentCreemTestMode",
  },
  payment_creem_webhook_secret: {
    type: "string",
    default: "",
    env: "CREEM_WEBHOOK_SECRET",
    labelKey: "paymentCreemWebhookSecret",
    descriptionKey: "paymentCreemWebhookSecret",
  },
  // PayPal
  payment_paypal_client_id: {
    type: "string",
    default: "",
    env: "PAYPAL_CLIENT_ID",
    labelKey: "paymentPaypalClientId",
    descriptionKey: "paymentPaypalClientId",
  },
  payment_paypal_client_secret: {
    type: "string",
    default: "",
    env: "PAYPAL_CLIENT_SECRET",
    labelKey: "paymentPaypalClientSecret",
    descriptionKey: "paymentPaypalClientSecret",
  },
  payment_paypal_webhook_id: {
    type: "string",
    default: "",
    env: "PAYPAL_WEBHOOK_ID",
    labelKey: "paymentPaypalWebhookId",
    descriptionKey: "paymentPaypalWebhookId",
  },
  payment_paypal_sandbox: {
    type: "boolean",
    default: true,
    env: "PAYPAL_SANDBOX",
    labelKey: "paymentPaypalSandbox",
    descriptionKey: "paymentPaypalSandbox",
  },
  // WeChat Pay
  payment_wechat_app_id: {
    type: "string",
    default: "",
    env: "WECHAT_APP_ID",
    labelKey: "paymentWechatAppId",
    descriptionKey: "paymentWechatAppId",
  },
  payment_wechat_mch_id: {
    type: "string",
    default: "",
    env: "WECHAT_MCH_ID",
    labelKey: "paymentWechatMchId",
    descriptionKey: "paymentWechatMchId",
  },
  payment_wechat_api_key: {
    type: "string",
    default: "",
    env: "WECHAT_API_KEY",
    labelKey: "paymentWechatApiKey",
    descriptionKey: "paymentWechatApiKey",
  },
  payment_wechat_api_v3_key: {
    type: "string",
    default: "",
    env: "WECHAT_API_V3_KEY",
    labelKey: "paymentWechatApiV3Key",
    descriptionKey: "paymentWechatApiV3Key",
  },
  payment_wechat_serial_no: {
    type: "string",
    default: "",
    env: "WECHAT_SERIAL_NO",
    labelKey: "paymentWechatSerialNo",
    descriptionKey: "paymentWechatSerialNo",
  },
  payment_wechat_private_key: {
    type: "string",
    default: "",
    env: "WECHAT_PRIVATE_KEY",
    labelKey: "paymentWechatPrivateKey",
    descriptionKey: "paymentWechatPrivateKey",
  },
  // Alipay
  payment_alipay_app_id: {
    type: "string",
    default: "",
    env: "ALIPAY_APP_ID",
    labelKey: "paymentAlipayAppId",
    descriptionKey: "paymentAlipayAppId",
  },
  payment_alipay_private_key: {
    type: "string",
    default: "",
    env: "ALIPAY_PRIVATE_KEY",
    labelKey: "paymentAlipayPrivateKey",
    descriptionKey: "paymentAlipayPrivateKey",
  },
  payment_alipay_public_key: {
    type: "string",
    default: "",
    env: "ALIPAY_PUBLIC_KEY",
    labelKey: "paymentAlipayPublicKey",
    descriptionKey: "paymentAlipayPublicKey",
  },
  payment_alipay_sandbox: {
    type: "boolean",
    default: true,
    env: "ALIPAY_SANDBOX",
    labelKey: "paymentAlipaySandbox",
    descriptionKey: "paymentAlipaySandbox",
  },
  // credit (public)
  public_credit_enable: {
    type: "boolean",
    default: false,
    env: "VITE_CREDIT_ENABLE",
    labelKey: "creditEnable",
    descriptionKey: "creditEnable",
  },
  public_credit_allow_free_user_purchase: {
    type: "boolean",
    default: false,
    env: "VITE_CREDIT_ALLOW_FREE_USER_PURCHASE",
    labelKey: "creditAllowFreeUserPurchase",
    descriptionKey: "creditAllowFreeUserPurchase",
  },
  public_credit_signup_bonus_enabled: {
    type: "boolean",
    default: false,
    env: "VITE_CREDIT_SIGNUP_BONUS_ENABLED",
    labelKey: "creditSignupBonusEnabled",
    descriptionKey: "creditSignupBonusEnabled",
  },
  public_credit_signup_bonus_amount: {
    type: "number",
    default: 0,
    env: "VITE_CREDIT_SIGNUP_BONUS_AMOUNT",
    labelKey: "creditSignupBonusAmount",
    descriptionKey: "creditSignupBonusAmount",
  },
  public_credit_signup_bonus_expire_days: {
    type: "number",
    default: 30,
    env: "VITE_CREDIT_SIGNUP_BONUS_EXPIRE_DAYS",
    labelKey: "creditSignupBonusExpireDays",
    descriptionKey: "creditSignupBonusExpireDays",
  },
  // daily free credits
  public_credit_daily_enabled: {
    type: "boolean",
    default: false,
    env: "VITE_CREDIT_DAILY_ENABLED",
    labelKey: "creditDailyEnabled",
    descriptionKey: "creditDailyEnabled",
  },
  public_credit_daily_amount: {
    type: "number",
    default: 0,
    env: "VITE_CREDIT_DAILY_AMOUNT",
    labelKey: "creditDailyAmount",
    descriptionKey: "creditDailyAmount",
  },
  // mail
  mail_provider: {
    type: "select",
    default: "resend",
    env: "EMAIL_PROVIDER",
    labelKey: "mailProvider",
    descriptionKey: "mailProvider",
    options: [{ value: "resend" }, { value: "custom" }],
    validation: z.enum(["resend", "custom"]),
  },
  mail_from: {
    type: "string",
    default: "",
    env: "EMAIL_FROM",
    labelKey: "mailFrom",
    descriptionKey: "mailFrom",
  },
  mail_resend_api_key: {
    type: "string",
    default: "",
    env: "RESEND_API_KEY",
    labelKey: "resendApiKey",
    descriptionKey: "resendApiKey",
  },
  // storage (S3 compatible)
  storage_region: {
    type: "string",
    default: "auto",
    env: "STORAGE_REGION",
    labelKey: "storageRegion",
    descriptionKey: "storageRegion",
  },
  storage_bucket_name: {
    type: "string",
    default: "",
    env: "STORAGE_BUCKET_NAME",
    labelKey: "storageBucketName",
    descriptionKey: "storageBucketName",
  },
  storage_access_key_id: {
    type: "string",
    default: "",
    env: "STORAGE_ACCESS_KEY_ID",
    labelKey: "storageAccessKeyId",
    descriptionKey: "storageAccessKeyId",
  },
  storage_secret_access_key: {
    type: "string",
    default: "",
    env: "STORAGE_SECRET_ACCESS_KEY",
    labelKey: "storageSecretAccessKey",
    descriptionKey: "storageSecretAccessKey",
  },
  storage_endpoint: {
    type: "string",
    default: "",
    env: "STORAGE_ENDPOINT",
    labelKey: "storageEndpoint",
    descriptionKey: "storageEndpoint",
  },
  storage_public_url: {
    type: "string",
    default: "",
    env: "STORAGE_PUBLIC_URL",
    labelKey: "storagePublicUrl",
    descriptionKey: "storagePublicUrl",
  },
})

export const configGroups = [
  defineGroup({
    id: "storage",
    labelKey: "storage",
    prefixes: ["storage_"],
  }),
  defineGroup({
    id: "mail",
    labelKey: "mail",
    prefixes: ["mail_"],
  }),
  defineGroup({
    id: "user",
    labelKey: "user",
    prefixes: ["user_"],
  }),
  defineGroup({
    id: "payment",
    labelKey: "payment",
    prefixes: ["payment_", "public_payment_"],
    subGroups: [
      defineSubGroup({
        id: "payment-stripe",
        labelKey: "paymentStripe",
        keys: [
          "payment_stripe_publishable_key",
          "payment_stripe_secret_key",
          "payment_stripe_webhook_secret",
        ],
      }),
      defineSubGroup({
        id: "payment-creem",
        labelKey: "paymentCreem",
        keys: [
          "payment_creem_x_api_key",
          "payment_creem_test_mode",
          "payment_creem_webhook_secret",
        ],
      }),
      defineSubGroup({
        id: "payment-paypal",
        labelKey: "paymentPaypal",
        keys: [
          "payment_paypal_client_id",
          "payment_paypal_client_secret",
          "payment_paypal_webhook_id",
          "payment_paypal_sandbox",
        ],
      }),
      defineSubGroup({
        id: "payment-wechat",
        labelKey: "paymentWechat",
        keys: [
          "payment_wechat_app_id",
          "payment_wechat_mch_id",
          "payment_wechat_api_key",
          "payment_wechat_api_v3_key",
          "payment_wechat_serial_no",
          "payment_wechat_private_key",
        ],
      }),
      defineSubGroup({
        id: "payment-alipay",
        labelKey: "paymentAlipay",
        keys: [
          "payment_alipay_app_id",
          "payment_alipay_private_key",
          "payment_alipay_public_key",
          "payment_alipay_sandbox",
        ],
      }),
    ],
  }),
  defineGroup({
    id: "credit",
    labelKey: "credit",
    prefixes: ["credit_", "public_credit_"],
    subGroups: [
      defineSubGroup({
        id: "credit-basic",
        labelKey: "creditBasic",
        keys: ["public_credit_enable", "public_credit_allow_free_user_purchase"],
      }),
      defineSubGroup({
        id: "credit-signup-bonus",
        labelKey: "creditSignupBonus",
        keys: [
          "public_credit_signup_bonus_enabled",
          "public_credit_signup_bonus_amount",
          "public_credit_signup_bonus_expire_days",
        ],
      }),
      defineSubGroup({
        id: "credit-daily",
        labelKey: "creditDaily",
        keys: ["public_credit_daily_enabled", "public_credit_daily_amount"],
      }),
    ],
  }),
]

export const configResolver = createConfigResolver(configSchema)

export type ConfigValues = ReturnType<typeof configResolver.resolveAllConfigs>
