import { z } from "zod"
import {
  createConfigResolver,
  defineConfig,
  defineGroup,
  defineSubGroup,
} from "@/shared/lib/config/helper"

export const configSchema = defineConfig({
  payment_provider: {
    type: "select",
    default: "stripe",
    env: "VITE_PAYMENT_PROVIDER",
    labelKey: "paymentProvider",
    descriptionKey: "paymentProvider",
    options: [{ value: "stripe" }, { value: "creem" }],
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
  // credit
  credit_enable: {
    type: "boolean",
    default: false,
    env: "VITE_CREDIT_ENABLE",
    labelKey: "creditEnable",
    descriptionKey: "creditEnable",
  },
  credit_allow_free_user_purchase: {
    type: "boolean",
    default: false,
    env: "VITE_CREDIT_ALLOW_FREE_USER_PURCHASE",
    labelKey: "creditAllowFreeUserPurchase",
    descriptionKey: "creditAllowFreeUserPurchase",
  },
  credit_signup_bonus_enabled: {
    type: "boolean",
    default: false,
    env: "VITE_CREDIT_SIGNUP_BONUS_ENABLED",
    labelKey: "creditSignupBonusEnabled",
    descriptionKey: "creditSignupBonusEnabled",
  },
  credit_signup_bonus_amount: {
    type: "number",
    default: 0,
    env: "VITE_CREDIT_SIGNUP_BONUS_AMOUNT",
    labelKey: "creditSignupBonusAmount",
    descriptionKey: "creditSignupBonusAmount",
  },
  credit_signup_bonus_expire_days: {
    type: "number",
    default: 30,
    env: "VITE_CREDIT_SIGNUP_BONUS_EXPIRE_DAYS",
    labelKey: "creditSignupBonusExpireDays",
    descriptionKey: "creditSignupBonusExpireDays",
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
})

export const configGroups = [
  defineGroup({
    id: "mail",
    labelKey: "mail",
    prefixes: ["mail_"],
  }),
  defineGroup({
    id: "payment",
    labelKey: "payment",
    prefixes: ["payment_"],
    subGroups: [
      defineSubGroup({
        id: "payment-stripe",
        labelKey: "paymentStripe",
        keys: ["payment_stripe_secret_key", "payment_stripe_webhook_secret"],
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
    ],
  }),
  defineGroup({
    id: "credit",
    labelKey: "credit",
    prefixes: ["credit_"],
    subGroups: [
      defineSubGroup({
        id: "credit-basic",
        labelKey: "creditBasic",
        keys: ["credit_enable", "credit_allow_free_user_purchase"],
      }),
      defineSubGroup({
        id: "credit-signup-bonus",
        labelKey: "creditSignupBonus",
        keys: [
          "credit_signup_bonus_enabled",
          "credit_signup_bonus_amount",
          "credit_signup_bonus_expire_days",
        ],
      }),
    ],
  }),
]

export const configResolver = createConfigResolver(configSchema)

export type ConfigValues = ReturnType<typeof configResolver.resolveAllConfigs>
