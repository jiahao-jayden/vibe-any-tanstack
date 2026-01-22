import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import { getTranslationContent, type Locale } from "intlayer"
import { verificationEmailTranslations } from "@/config/locale/auth.content"
import { siteConfig } from "@/config/site-config"

interface VerificationEmailProps {
  verificationLink: string
  locale?: string
}

export function VerificationEmail({ verificationLink, locale = "en" }: VerificationEmailProps) {
  const { title } = siteConfig
  const i18n = verificationEmailTranslations
  const t = {
    preview: getTranslationContent(i18n.preview, locale as Locale),
    heading: getTranslationContent(i18n.heading, locale as Locale),
    description: getTranslationContent(i18n.description, locale as Locale),
    button: getTranslationContent(i18n.button, locale as Locale),
    footer: getTranslationContent(i18n.footer, locale as Locale),
    hint: getTranslationContent(i18n.hint, locale as Locale),
    expiry: getTranslationContent(i18n.expiry, locale as Locale),
  }

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={brand}>{title}</Text>
            <Heading style={heading}>{t.heading}</Heading>
            <Text style={paragraph}>{t.description}</Text>
            <Text style={expiry}>{t.expiry}</Text>
            <Button
              style={button}
              href={verificationLink}
            >
              {t.button}
            </Button>
            <Text style={hint}>{t.hint}</Text>
            <Text style={link}>{verificationLink}</Text>
            <Text style={footer}>{t.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
}

const box = {
  padding: "0 48px",
}

const brand = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "20px 0 10px",
}

const heading = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  textAlign: "center" as const,
  margin: "30px 0",
}

const paragraph = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "center" as const,
}

const expiry = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "20px",
  textAlign: "center" as const,
  marginTop: "8px",
}

const button = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  margin: "24px auto",
}

const hint = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "32px",
}

const link = {
  color: "#525f7f",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  wordBreak: "break-all" as const,
}

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "32px",
}

export default VerificationEmail
