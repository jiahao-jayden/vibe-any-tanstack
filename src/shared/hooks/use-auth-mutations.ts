import { useMutation } from "@tanstack/react-query"
import { useCallback, useRef, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { authClient } from "@/shared/lib/auth/auth-client"

interface UseAuthMutationsOptions {
  onSignInSuccess?: () => void
  onSignUpSuccess?: () => void
}

export function useAuthMutations(options: UseAuthMutationsOptions = {}) {
  const { loginPage } = useIntlayer("auth")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileResetRef = useRef<(() => void) | null>(null)

  const resetTurnstile = useCallback(() => {
    turnstileResetRef.current?.()
    setTurnstileToken(null)
  }, [])

  const isCaptchaEnabled = import.meta.env.VITE_TURNSTILE_CAPTCHA_ENABLED === "true"

  const getCaptchaHeaders = useCallback(() => {
    if (isCaptchaEnabled && !turnstileToken) {
      throw new Error(loginPage.toast.captchaRequired.value)
    }
    return isCaptchaEnabled && turnstileToken ? { "x-captcha-response": turnstileToken } : undefined
  }, [turnstileToken, loginPage.toast.captchaRequired.value, isCaptchaEnabled])

  const handleAuthError = useCallback(
    (error: { code?: string; message?: string; status?: number }, fallbackMessage: string) => {
      if (error.code === "EMAIL_NOT_VERIFIED" || error.status === 403) {
        toast.error(loginPage.toast.emailNotVerified.value)
      } else if (error.code === "USER_ALREADY_EXISTS") {
        toast.error(loginPage.toast.signUpError.value)
      } else if (error.code === "INVALID_EMAIL_OR_PASSWORD") {
        toast.error(loginPage.toast.signInError.value)
      } else {
        toast.error(error.message || fallbackMessage)
      }
      resetTurnstile()
    },
    [loginPage, resetTurnstile]
  )

  const googleMutation = useMutation({
    mutationFn: () =>
      authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
        fetchOptions: {
          headers: getCaptchaHeaders(),
          onError: (ctx) => handleAuthError(ctx.error, loginPage.toast.googleError.value),
        },
      }),
  })

  const githubMutation = useMutation({
    mutationFn: () =>
      authClient.signIn.social({
        provider: "github",
        callbackURL: window.location.origin,
        fetchOptions: {
          headers: getCaptchaHeaders(),
          onError: (ctx) => handleAuthError(ctx.error, loginPage.toast.githubError.value),
        },
      }),
  })

  const signInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authClient.signIn.email({
        email,
        password,
        callbackURL: "/",
        fetchOptions: {
          headers: getCaptchaHeaders(),
          onSuccess: () => {
            toast.success(loginPage.toast.signInSuccess.value)
            options.onSignInSuccess?.()
          },
          onError: (ctx) => handleAuthError(ctx.error, loginPage.toast.signInError.value),
        },
      }),
  })

  const signUpMutation = useMutation({
    mutationFn: ({ email, password, name }: { email: string; password: string; name: string }) =>
      authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/",
        fetchOptions: {
          headers: getCaptchaHeaders(),
          onSuccess: () => {
            toast.success(loginPage.toast.signUpSuccess.value, { duration: 6000 })
            options.onSignUpSuccess?.()
          },
          onError: (ctx) => handleAuthError(ctx.error, loginPage.toast.signUpError.value),
        },
      }),
  })

  const isLoading =
    googleMutation.isPending ||
    githubMutation.isPending ||
    signInMutation.isPending ||
    signUpMutation.isPending

  return {
    googleMutation,
    githubMutation,
    signInMutation,
    signUpMutation,
    isLoading,
    turnstileToken,
    setTurnstileToken,
    turnstileResetRef,
    resetTurnstile,
    loginPage,
  }
}
