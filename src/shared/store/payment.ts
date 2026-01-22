import { create } from "zustand"
import { persist } from "zustand/middleware"
import { checkUserLifetimePurchaseAction, getUserActiveSubscriptionAction } from "@/actions/payment"
import { getPlans } from "@/config/payment-config"
import { PlanTypes, type PlanWithPrice, type Subscription } from "@/shared/types/payment"

// Payment store state interface
interface PaymentState {
  // State properties
  activePlan: PlanWithPrice | null
  activeSubscription: Subscription | null
  error: string | null
  isLoading: boolean

  // Actions
  fetchPaymentInfo: (userId: string) => Promise<void>
  resetPaymentInfo: () => void
  setError: (error: string | null) => void
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set) => ({
      // Initial state
      activePlan: null,
      activeSubscription: null,
      error: null,
      isLoading: false,

      // Fetch payment information for a user
      fetchPaymentInfo: async (userId) => {
        // Early return if no userId provided
        if (!userId) {
          return
        }

        // Reset error state and set loading
        set({
          error: null,
          isLoading: true,
        })

        try {
          // Get all available plans and categorize them
          const plans: PlanWithPrice[] = getPlans()

          const freePlans = plans.filter((plan) => plan.planType === PlanTypes.FREE)
          const subscriptionPlans = plans.filter((plan) => plan.planType === PlanTypes.SUBSCRIPTION)
          const lifetimePlans = plans.filter((plan) => plan.planType === PlanTypes.LIFETIME)

          // Set default free plan initially
          const defaultFreePlan = freePlans[0]
          set({
            activePlan: defaultFreePlan,
            activeSubscription: null,
          })

          // Check for lifetime purchase first (higher priority)
          try {
            const lifetimeResult = await checkUserLifetimePurchaseAction({
              data: { userId },
            })

            if (lifetimeResult.success && lifetimeResult.data?.existsLifetimePayment) {
              const lifetimePriceId = lifetimeResult.data.lifetimePriceId

              // Find matching lifetime plan by priceId
              const userLifetimePlan = lifetimePlans.find((plan) =>
                plan.prices.some((price) => price.priceId === lifetimePriceId)
              )

              if (userLifetimePlan) {
                set({
                  activePlan: userLifetimePlan,
                  activeSubscription: null,
                  isLoading: false,
                })
              } else {
                console.warn(`No matching lifetime plan found for priceId: ${lifetimePriceId}`)

                // Fallback to first lifetime plan
                const fallbackLifetimePlan = lifetimePlans[0]
                if (fallbackLifetimePlan) {
                  set({
                    activePlan: fallbackLifetimePlan,
                    activeSubscription: null,
                    isLoading: false,
                  })
                }
              }
              return
            }
          } catch (error) {
            console.error("Check user lifetime purchase failed:", error)
            const errorMessage =
              error instanceof Error ? error.message : "Failed to check lifetime purchase"
            set({
              error: `Lifetime check failed: ${errorMessage}`,
            })
          }

          // Check for active subscription (if no lifetime purchase)
          try {
            const subscriptionResult = await getUserActiveSubscriptionAction({
              data: {
                userId,
              },
            })

            if (subscriptionResult.success && subscriptionResult.data) {
              const activeSubscription = subscriptionResult.data

              // Find matching subscription plan by priceId
              const userSubscriptionPlan = subscriptionPlans.find((plan) =>
                plan.prices.some((price) => price.priceId === activeSubscription.priceId)
              )

              if (userSubscriptionPlan) {
                set({
                  activePlan: userSubscriptionPlan,
                  activeSubscription: activeSubscription,
                  isLoading: false,
                })
              } else {
                console.warn(
                  `No matching subscription plan found for priceId: ${activeSubscription.priceId}`
                )

                // Fallback to first subscription plan
                const fallbackSubscriptionPlan = subscriptionPlans[0]
                if (fallbackSubscriptionPlan) {
                  set({
                    activePlan: fallbackSubscriptionPlan,
                    activeSubscription: activeSubscription,
                    isLoading: false,
                  })
                }
              }
            } else {
              // No active subscription, keep default free plan
              set({ isLoading: false })
            }
          } catch (error) {
            console.error("Get user active subscription failed:", error)
            const errorMessage =
              error instanceof Error ? error.message : "Failed to get active subscription"
            set({
              error: `Subscription check failed: ${errorMessage}`,
            })
          }
        } catch (error) {
          console.error("Failed to fetch payment info:", error)
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch payment information"
          set({
            error: errorMessage,
            isLoading: false,
          })
        } finally {
          // Ensure loading state is always cleared
          set((state) => ({
            ...state,
            isLoading: false,
          }))
        }
      },

      // Reset all payment information
      resetPaymentInfo: () => {
        set({
          activePlan: null,
          activeSubscription: null,
          error: null,
          isLoading: false,
        })
      },

      // Set error message
      setError: (error: string | null) => {
        set({ error })
      },
    }),
    {
      name: "payment-store",
      partialize: (state) => ({
        activePlan: state.activePlan,
        activeSubscription: state.activeSubscription,
      }),
    }
  )
)
