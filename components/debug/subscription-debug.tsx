"use client"

import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { useHydration } from "@/hooks/use-hydration"

export function SubscriptionDebug() {
  const { user, loading: authLoading } = useAuth()
  const { hasActiveSubscription, loadingUserSubscription, userSubscription } = useSubscription(user)
  const { isHydrated } = useHydration()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-sm">
      <h3 className="font-bold mb-2">Debug Subscription</h3>
      <div className="space-y-1">
        <div>Hydrated: {isHydrated ? '✓' : '✗'}</div>
        <div>Auth Loading: {authLoading ? '⏳' : '✓'}</div>
        <div>User: {user ? '✓' : '✗'}</div>
        <div>Loading Subscription: {loadingUserSubscription ? '⏳' : '✓'}</div>
        <div>Has Active Sub: {hasActiveSubscription ? '✓' : '✗'}</div>
        <div>User Sub: {userSubscription ? 'Yes' : 'No'}</div>
      </div>
    </div>
  )
}
