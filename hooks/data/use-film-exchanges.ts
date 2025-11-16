"use client"

import React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useFilmExchangesStore } from "@/stores/film-exchanges-store"
import type {
  PendingExchangeRequest,
  PendingExchangeProposal,
} from "@/types/exchange"

interface UseFilmExchangesReturn {
  // Data
  requests: PendingExchangeRequest[]
  proposals: PendingExchangeProposal[]
  loading: boolean
  isHydrated: boolean

  // Getters
  pendingRequestsCount: number
  pendingProposalsCount: number
  totalPendingCount: number
  hasRequest: (exchangeId: string) => boolean
  hasProposal: (exchangeId: string) => boolean

  // Actions
  refreshExchanges: () => Promise<void>
  markExchangeProcessed: (exchangeId: string) => void
}

/**
 * Hook pour accéder aux échanges de films de l'utilisateur
 * Gère les demandes reçues et les propositions envoyées
 */
export function useFilmExchanges(): UseFilmExchangesReturn {
  const [isHydrated, setIsHydrated] = React.useState(false)
  const { user } = useAuth()

  const {
    data,
    getPendingRequestsCount,
    getPendingProposalsCount,
    getTotalPendingCount,
    hasRequest,
    hasProposal,
    markExchangeProcessed,
    isLoading,
    fetchData,
    needsRefresh,
    initializing,
    checkUserChanged,
  } = useFilmExchangesStore()

  const loading = isLoading()
  const userId = user?.id || null

  // Track hydration status
  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Auto-fetch exchanges if needed (only after hydration)
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

  // Wrapper pour refreshExchanges
  const refreshExchanges = React.useCallback(async () => {
    await fetchData(userId)
  }, [fetchData, userId])

  return {
    requests: data.requests,
    proposals: data.proposals,
    loading: loading || !isHydrated,
    isHydrated,
    pendingRequestsCount: getPendingRequestsCount(),
    pendingProposalsCount: getPendingProposalsCount(),
    totalPendingCount: getTotalPendingCount(),
    hasRequest,
    hasProposal,
    refreshExchanges,
    markExchangeProcessed,
  }
}
