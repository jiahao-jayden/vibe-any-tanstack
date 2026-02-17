import React from "react"

export type EmailType = "magic-link" | "verification" | "waitlist"

export interface EmailData {
  to: string
  url?: string
  locale?: string
  subject: string
  type?: EmailType
}

interface EmailSendData extends EmailData {
  from: string
}

export interface EmailStrategy {
  sendEmail(data: EmailSendData, emailHtml: string): Promise<void>
}

export class ResendEmailStrategy implements EmailStrategy {
  private resendInstance: unknown
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async sendEmail(data: EmailSendData, emailHtml: string): Promise<void> {
    if (!this.resendInstance) {
      const { Resend } = await import("resend")
      this.resendInstance = new Resend(this.apiKey)
    }
    const resend = this.resendInstance as {
      emails: { send: (opts: Record<string, string>) => Promise<unknown> }
    }
    await resend.emails.send({
      from: data.from,
      to: data.to,
      subject: data.subject,
      html: emailHtml,
    })
  }
}

export class NodemailerEmailStrategy implements EmailStrategy {
  private transporter: unknown
  private config: {
    host: string
    port: number
    secure: boolean
    auth: { user: string; pass: string }
  }

  constructor(config: {
    host: string
    port: number
    secure: boolean
    auth: { user: string; pass: string }
  }) {
    this.config = config
  }

  async sendEmail(data: EmailSendData, emailHtml: string): Promise<void> {
    if (!this.transporter) {
      const nodemailer = await import("nodemailer")
      this.transporter = nodemailer.default.createTransport(this.config)
    }
    await (
      this.transporter as { sendMail: (opts: Record<string, string>) => Promise<void> }
    ).sendMail({
      from: data.from,
      to: data.to,
      subject: data.subject,
      html: emailHtml,
    })
  }
}

async function renderEmailTemplate(data: EmailData): Promise<string> {
  const { render } = await import("@react-email/components")
  const type = data.type || "magic-link"

  if (type === "verification") {
    const { VerificationEmail } = await import("@/shared/components/email/verification-email")
    return render(
      React.createElement(VerificationEmail, {
        verificationLink: data.url || "",
        locale: data.locale || "en",
      })
    )
  }

  if (type === "waitlist") {
    const { WaitlistEmail } = await import("@/shared/components/email/waitlist-email")
    return render(
      React.createElement(WaitlistEmail, {
        locale: data.locale || "en",
      })
    )
  }

  const { MagicLinkEmail } = await import("@/shared/components/email/magic-link-email")
  return render(
    React.createElement(MagicLinkEmail, {
      magicLink: data.url || "",
      locale: data.locale || "en",
    })
  )
}

export class EmailContext {
  private strategy: EmailStrategy

  constructor(strategy: EmailStrategy) {
    this.strategy = strategy
  }

  setStrategy(strategy: EmailStrategy): void {
    this.strategy = strategy
  }

  async sendEmail(data: EmailData): Promise<void> {
    const from = process.env.EMAIL_FROM
    if (!from) {
      throw new Error("EMAIL_FROM environment variable is not set")
    }

    const emailHtml = await renderEmailTemplate(data)
    await this.strategy.sendEmail({ ...data, from }, emailHtml)
  }
}

export const isEmailEnabled =
  !!process.env.EMAIL_FROM &&
  !!process.env.EMAIL_PROVIDER &&
  (process.env.EMAIL_PROVIDER === "resend"
    ? !!process.env.RESEND_API_KEY
    : process.env.EMAIL_PROVIDER === "custom"
      ? !!process.env.EMAIL_HOST && !!process.env.EMAIL_USER && !!process.env.EMAIL_PASSWORD
      : false)

export function createEmailContext(): EmailContext {
  if (!process.env.EMAIL_PROVIDER) {
    throw new Error("Email is not configured. Please set EMAIL_PROVIDER environment variable.")
  }

  let strategy: EmailStrategy

  if (process.env.EMAIL_PROVIDER === "resend") {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is required when using Resend email provider")
    }
    strategy = new ResendEmailStrategy(process.env.RESEND_API_KEY)
  } else if (process.env.EMAIL_PROVIDER === "custom") {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error(
        "EMAIL_HOST, EMAIL_USER and EMAIL_PASSWORD are required when using custom email provider"
      )
    }
    strategy = new NodemailerEmailStrategy({
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  } else {
    throw new Error(
      `Unsupported email provider: ${process.env.EMAIL_PROVIDER}. Supported: resend, custom`
    )
  }

  return new EmailContext(strategy)
}

export const sendEmail = async (data: EmailData): Promise<void> => {
  const emailContext = createEmailContext()
  await emailContext.sendEmail(data)
}
