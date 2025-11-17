"use client"

import {
  PendingExchangeRequest,
  PendingExchangeProposal,
} from "@/types/exchange"
import { createCachedStore, BaseCachedStore } from "./create-cached-store"

// ============================================================================
// TYPES
// ============================================================================

interface ExchangeData {
  requests: PendingExchangeRequest[] // Demandes reçues
  proposals: PendingExchangeProposal[] // Propositions envoyées
}

interface FilmExchangesState extends BaseCachedStore<ExchangeData> {
  // Getters
  getPendingRequestsCount: () => number
  getPendingProposalsCount: () => number
  getTotalPendingCount: () => number
  hasRequest: (exchangeId: string) => boolean
  hasProposal: (exchangeId: string) => boolean

  // Actions spécifiques
  refreshExchanges: (userId: string) => Promise<void>
  markExchangeProcessed: (exchangeId: string) => void
}

// ============================================================================
// FETCH FUNCTION
// ============================================================================

async function fetchUserExchanges(userId: string | null): Promise<ExchangeData> {
  if (!userId) {
    return { requests: [], proposals: [] }
  }

  // NOTE: Système d'échange migré vers échanges instantanés (Nov 2025)
  // Plus de demandes en attente - les échanges sont automatiques et immédiats
  // Ce store est conservé pour compatibilité mais retourne toujours des tableaux vides
  return { requests: [], proposals: [] }
}

// ============================================================================
// STORE CREATION
// ============================================================================

export const useFilmExchangesStore = createCachedStore<
  ExchangeData,
  FilmExchangesState
>({
  name: "film-exchanges-store",
  cacheDuration: 2 * 60 * 1000, // 2 minutes (notifications temps réel)
  partializeFields: ["data", "lastFetch", "currentUserId"],

  initialState: () => ({ requests: [], proposals: [] }),

  fetchData: fetchUserExchanges,

  storeActions: (set, get) => ({
    // Getters
    getPendingRequestsCount: () => {
      return get().data.requests.length
    },

    getPendingProposalsCount: () => {
      return get().data.proposals.length
    },

    getTotalPendingCount: () => {
      const { requests, proposals } = get().data
      return requests.length + proposals.length
    },

    hasRequest: (exchangeId: string) => {
      return get().data.requests.some((req) => req.exchange_id === exchangeId)
    },

    hasProposal: (exchangeId: string) => {
      return get().data.proposals.some(
        (prop) => prop.exchange_id === exchangeId
      )
    },

    // Actions
    refreshExchanges: async (userId: string) => {
      await get().fetchData(userId)
    },

    markExchangeProcessed: (exchangeId: string) => {
      // Retirer l'échange de la liste locale (optimistic update)
      const currentData = get().data
      set({
        data: {
          requests: currentData.requests.filter(
            (req) => req.exchange_id !== exchangeId
          ),
          proposals: currentData.proposals.filter(
            (prop) => prop.exchange_id !== exchangeId
          ),
        },
      })
    },
  }),

  onFetchSuccess: (data) => {
    const total = data.requests.length + data.proposals.length
    console.log(`Loaded ${total} pending exchanges for user`)
  },

  onFetchError: (error) => {
    console.error("Failed to load exchanges:", error)
  },
})
