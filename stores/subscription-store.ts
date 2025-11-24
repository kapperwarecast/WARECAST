"use client"

import React from "react"
import { useAuth } from "@/contexts/auth-context"
import { createCachedStore, BaseCachedStore } from "./create-cached-store"
import type { UserSubscriptionData, Abonnement } from "@/types/subscription"

interface SubscriptionStore extends BaseCachedStore<UserSubscriptionData | null> {
  availableSubscriptions: Abonnement[]

  // Actions
  setAvailableSubscriptions: (subscriptions: Abonnement[]) => void
  fetchAvailableSubscriptions: () => Promise<void>

  // Getters
  hasActiveSubscription: () => boolean
  isSubscriptionExpired: () => boolean
  daysUntilExpiration: () => number | null
}

// Fetch user subscription from API
async function fetchUserSubscription(userId: string | null): Promise<UserSubscriptionData | null> {
  if (!userId) return null

  const response = await fetch("/api/user-subscription", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  // If unauthorized, return null
  if (response.status === 401) {
    return null
  }

  // Other errors
  if (!response.ok) {
    const result = await response.json()
    console.warn("Error fetching subscription:", result.error || response.statusText)
    throw new Error(result.error || response.statusText)
  }

  const result = await response.json()

  if (result.success) {
    return result.subscription || null
  }

  throw new Error("Invalid response format")
}

export const useSubscriptionStore = createCachedStore<
  UserSubscriptionData | null,
  SubscriptionStore
>({
  name: "warecast-subscription",
  cacheDuration: 10 * 60 * 1000, // 10 minutes
  partializeFields: ["data", "availableSubscriptions", "lastFetch", "currentUserId"],

  initialState: () => null,

  fetchData: fetchUserSubscription,

  storeActions: (set, get) => ({
    availableSubscriptions: [],

    hasActiveSubscription: () => {
      const { data: userSubscription } = get()
      return Boolean(
        userSubscription &&
        (userSubscription.statut === "actif" || userSubscription.statut === "résilié" || userSubscription.statut === "resilie") &&
        new Date(userSubscription.date_expiration) > new Date()
      )
    },

    isSubscriptionExpired: () => {
      const { data: userSubscription } = get()
      return Boolean(
        userSubscription &&
        new Date(userSubscription.date_expiration) <= new Date()
      )
    },

    daysUntilExpiration: () => {
      const { data: userSubscription } = get()
      if (!userSubscription) return null
      return Math.ceil(
        (new Date(userSubscription.date_expiration).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
      )
    },

    setAvailableSubscriptions: (subscriptions: Abonnement[]) => {
      set({ availableSubscriptions: subscriptions })
    },

    fetchAvailableSubscriptions: async () => {
      try {
        const response = await fetch("/api/available-subscriptions", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          console.warn("Error fetching available subscriptions")
          return
        }

        const result = await response.json()

        if (result.success && result.subscriptions) {
          set({ availableSubscriptions: result.subscriptions })
        }
      } catch (error) {
        console.debug("Subscription store: Could not fetch available subscriptions")
      }
    },
  }),
})

// Hook for components with hydration handling
export const useSubscriptionFromStore = () => {
  const [isHydrated, setIsHydrated] = React.useState(false)
  const { user } = useAuth()

  const {
    data: userSubscription,
    availableSubscriptions,
    hasActiveSubscription,
    isSubscriptionExpired,
    daysUntilExpiration,
    isLoading,
    fetchData: fetchUserSubscription,
    fetchAvailableSubscriptions,
    needsRefresh,
    initializing,
    checkUserChanged,
  } = useSubscriptionStore()

  const loading = isLoading()
  const userId = user?.id || null

  // Track hydration status
  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Auto-fetch user subscription if needed (only after hydration)
  React.useEffect(() => {
    const userChanged = checkUserChanged(userId)
    const shouldFetch = isHydrated && (needsRefresh() || userChanged) && !initializing

    if (shouldFetch) {
      const timer = setTimeout(() => {
        fetchUserSubscription(userId)
      }, 0)

      return () => clearTimeout(timer)
    }
  }, [isHydrated, needsRefresh, fetchUserSubscription, initializing, userId, checkUserChanged])

  // Fetch available subscriptions once
  React.useEffect(() => {
    if (isHydrated && availableSubscriptions.length === 0) {
      fetchAvailableSubscriptions()
    }
  }, [isHydrated, availableSubscriptions.length, fetchAvailableSubscriptions])

  return {
    userSubscription,
    availableSubscriptions,
    hasActiveSubscription: hasActiveSubscription(),
    isSubscriptionExpired: isSubscriptionExpired(),
    daysUntilExpiration: daysUntilExpiration(),
    loading: loading || !isHydrated,
    isHydrated,
  }
}
