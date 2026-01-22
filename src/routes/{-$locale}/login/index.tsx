import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import { createFileRoute } from "@tanstack/react-router"
import { ChevronLeftIcon, Eye, EyeOff, Loader2 } from "lucide-react"
import type React from "react"
import { useId, useState } from "react"
import { toast } from "sonner"
import { siteConfig } from "@/config/site-config"
import { LocalizedLink } from "@/shared/components/locale/localized-link"
import { FloatingPaths } from "@/shared/components/login/floating-paths"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { useAuthMutations } from "@/shared/hooks/use-auth-mutations"

export const Route = createFileRoute("/{-$locale}/login/")({
  component: RouteComponent,
})

function RouteComponent() {
  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { title, author } = siteConfig

  const {
    googleMutation,
    githubMutation,
    signInMutation,
    signUpMutation,
    isLoading,
    turnstileToken,
    setTurnstileToken,
    turnstileResetRef,
    loginPage,
  } = useAuthMutations({
    onSignInSuccess: () => {
      window.location.href = "/"
    },
    onSignUpSuccess: () => {
      setEmail("")
      setPassword("")
      setName("")
      setIsSignUp(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error(loginPage.toast.fillAllFields.value)
      return
    }
    if (isSignUp) {
      if (!name.trim()) {
        toast.error(loginPage.toast.enterName.value)
        return
      }
      signUpMutation.mutate({ email, password, name })
    } else {
      signInMutation.mutate({ email, password })
    }
  }

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <LocalizedLink
          to="/"
          className="relative z-10"
        >
          <span className="text-xl font-bold text-primary">{title}</span>
        </LocalizedLink>
        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">&ldquo;{loginPage.testimonial.value}&rdquo;</p>
            <footer className="font-mono text-sm font-semibold">~ {author}</footer>
          </blockquote>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col justify-center p-4">
        <div
          aria-hidden
          className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
        >
          <div className="absolute right-0 top-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,var(--color-foreground)/.06_0,hsla(0,0%,55%,.02)_50%,var(--color-foreground)/.01_80%)]" />
          <div className="absolute right-0 top-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,var(--color-foreground)/.04_0,var(--color-foreground)/.01_80%,transparent_100%)] [translate:5%_-50%]" />
        </div>

        <Button
          asChild
          className="absolute left-5 top-7"
          variant="ghost"
        >
          <LocalizedLink to="/">
            <ChevronLeftIcon className="size-4" />
            {loginPage.home.value}
          </LocalizedLink>
        </Button>

        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {isSignUp ? loginPage.signUp.title.value : loginPage.signIn.title.value}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp ? loginPage.signUp.description.value : loginPage.signIn.description.value}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => googleMutation.mutate()}
              disabled={isLoading || !turnstileToken}
            >
              {googleMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <GoogleIcon className="size-4" />
              )}
              {loginPage.social.google.value}
            </Button>

            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => githubMutation.mutate()}
              disabled={isLoading || !turnstileToken}
            >
              {githubMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <GithubIcon className="size-4" />
              )}
              {loginPage.social.github.value}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {loginPage.social.divider.value}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor={nameId}>{loginPage.form.name.value}</Label>
                <Input
                  id={nameId}
                  type="text"
                  placeholder={loginPage.form.namePlaceholder.value}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={emailId}>{loginPage.form.email.value}</Label>
              <Input
                id={emailId}
                type="email"
                placeholder={loginPage.form.emailPlaceholder.value}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={passwordId}>{loginPage.form.password.value}</Label>
              <div className="relative">
                <Input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? loginPage.form.hidePassword.value
                      : loginPage.form.showPassword.value
                  }
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Turnstile
              ref={(instance: TurnstileInstance | null) => {
                turnstileResetRef.current = () => instance?.reset()
              }}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
              options={{
                theme: "auto",
              }}
            />

            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={isLoading || !turnstileToken}
            >
              {signInMutation.isPending || signUpMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isSignUp ? (
                loginPage.signUp.button.value
              ) : (
                loginPage.signIn.button.value
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isSignUp ? loginPage.signUp.switchText.value : loginPage.signIn.switchText.value}
            </span>{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary underline underline-offset-4 hover:text-primary/80"
              disabled={isLoading}
            >
              {isSignUp ? loginPage.signUp.switchAction.value : loginPage.signIn.switchAction.value}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

const GithubIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)
