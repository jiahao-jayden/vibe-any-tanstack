let viteEnv: Record<string, string> | null = null
try {
  if (import.meta.env) viteEnv = import.meta.env
} catch {}

if (!viteEnv) {
  const dotenv = await import("dotenv")
  dotenv.config({ path: ".env.local" })
  dotenv.config({ path: ".env.development" })
  dotenv.config({ path: ".env" })
}

function getEnv(key: string): string | undefined {
  return viteEnv?.[key] ?? process.env[key]
}

export const env = {
  get DATABASE_URL() {
    return getEnv("DATABASE_URL")
  },
  get BETTER_AUTH_SECRET() {
    return getEnv("BETTER_AUTH_SECRET")
  },
  get BETTER_AUTH_URL() {
    return getEnv("VITE_BETTER_AUTH_URL")
  },
} as const
