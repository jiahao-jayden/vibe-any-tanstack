import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { captcha } from "better-auth/plugins"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { getTranslationContent, type Locale } from "intlayer"
import { verificationEmailTranslations } from "@/config/locale/auth.content"
import { getDb } from "@/db"
import { sendEmail } from "@/shared/lib/email/send-email"
import { isAuthConfigured } from "./auth-config"

const isCaptchaEnabled =
  process.env.TURNSTILE_CAPTCHA_ENABLED === "true" && !!process.env.TURNSTILE_SECRET_KEY

const isEmailVerificationEnabled = process.env.EMAIL_VERIFICATION_ENABLED === "true"

const isGitHubOAuthEnabled = !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET

const isGoogleOAuthEnabled = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET

function getLocaleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    const locale = pathParts[0]
    if (locale === "zh" || locale === "en") {
      return locale
    }
  } catch {
    // ignore
  }
  return "en"
}

function createAuth() {
  if (!isAuthConfigured) {
    return null
  }

  const db = getDb()
  if (!db) {
    return null
  }

  return betterAuth({
    baseURL: import.meta.env.VITE_APP_URL || "http://localhost:3377",
    database: drizzleAdapter(db, { provider: "pg" }),
    plugins: [
      ...(isCaptchaEnabled
        ? [
            captcha({
              provider: "cloudflare-turnstile",
              secretKey: process.env.TURNSTILE_SECRET_KEY as string,
            }),
          ]
        : []),
      tanstackStartCookies(),
    ],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: isEmailVerificationEnabled,
    },
    ...(isEmailVerificationEnabled && {
      emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
          const locale = getLocaleFromUrl(url)
          const subject = getTranslationContent(
            verificationEmailTranslations.subject,
            locale as Locale
          )

          await sendEmail({
            to: user.email,
            url,
            locale,
            subject,
            type: "verification",
          })
        },
      },
    }),
    socialProviders: {
      ...(isGitHubOAuthEnabled && {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID as string,
          clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
      }),
      ...(isGoogleOAuthEnabled && {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }),
    },
  })
}

export const auth = createAuth()

export function requireAuth() {
  if (!auth) {
    throw new Error(
      "Authentication is not configured. Please set DATABASE_URL and BETTER_AUTH_SECRET."
    )
  }
  return auth
}
