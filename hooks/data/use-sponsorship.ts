"use client"

import React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSponsorshipStore } from "@/stores/sponsorship-store"
import type {
  MySponsor,
  MySponsoredUser,
  UserBadge,
  BadgeLevel,
} from "@/types/sponsorship"

interface UseSponsorshipReturn {
  // Data
  sponsor: MySponsor | null
  sponsoredUsers: MySponsoredUser[]
  badges: UserBadge[]
  highestBadge: BadgeLevel | null
  loading: boolean
  isHydrated: boolean

  // Getters
  hasBeenSponsored: boolean
  hasSponsoredUsers: boolean
  sponsoredCount: number
  hasBadge: (level: BadgeLevel) => boolean

  // Actions
  refreshSponsorship: () => Promise<void>
}

/**
 * Hook pour accéder aux données de parrainage de l'utilisateur
 * Gère le parrain, les filleuls et les badges obtenus
 */
export function useSponsorship(): UseSponsorshipReturn {
  const [isHydrated, setIsHydrated] = React.useState(false)
  const { user } = useAuth()

  const {
    data,
    hasBeenSponsored,
    hasSponsoredUsers,
    getSponsoredCount,
    getHighestBadge,
    hasBadge,
    isLoading,
    fetchData,
    needsRefresh,
    initializing,
    checkUserChanged,
  } = useSponsorshipStore()

  const loading = isLoading()
  const userId = user?.id || null

  // Track hydration status
  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Auto-fetch sponsorship data if needed (only after hydration)
  React.useEffect(() => {
    const userChanged = checkUserChanged(userId)
    const shouldFetch = isHydrated && (needsRefresh() || userChanged) && !initializing

    if (shouldFetch) {
      const timer = setTimeout(() => {
        fetchData(userId)
      }, 0)

      return () => clearTimeout(timer)
    }
  }, [isHydrated, needsRefresh, fetchData, initializing, userId, checkUserChanged])

  // Wrapper pour refreshSponsorship
  const refreshSponsorship = React.useCallback(async () => {
    await fetchData(userId)
  }, [fetchData, userId])

  return {
    sponsor: data.sponsor,
    sponsoredUsers: data.sponsoredUsers,
    badges: data.badges,
    highestBadge: data.highestBadge,
    loading: loading || !isHydrated,
    isHydrated,
    hasBeenSponsored: hasBeenSponsored(),
    hasSponsoredUsers: hasSponsoredUsers(),
    sponsoredCount: getSponsoredCount(),
    hasBadge,
    refreshSponsorship,
  }
}
