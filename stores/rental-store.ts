"use client"

import React from "react"
import { useAuth } from "@/contexts/auth-context"
import { createCachedStore, BaseCachedStore } from "./create-cached-store"

interface RentalData {
  movieId: string
  isRented: boolean
  rentalId: string | null
  expiresAt: string | null
  lastSync: number
}

interface RentalStore extends BaseCachedStore<Record<string, RentalData>> {
  // Actions
  setRentalData: (movieId: string, data: Partial<RentalData>) => void
  refreshRental: (movieId: string) => Promise<void>

  // Getters
  getRentalData: (movieId: string) => RentalData
}

const defaultRentalData: RentalData = {
  movieId: "",
  isRented: false,
  rentalId: null,
  expiresAt: null,
  lastSync: 0,
}

// Fetch user rentals from API
async function fetchUserRentals(userId: string | null): Promise<Record<string, RentalData>> {
  if (!userId) return {}

  const response = await fetch("/api/rentals", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  // Always parse the JSON response first
  const result = await response.json()

  // If unauthorized, return empty (user not logged in)
  if (response.status === 401) {
    return {}
  }

  // Other errors
  if (!response.ok) {
    console.warn("Error fetching rentals:", result.error || response.statusText)
    throw new Error(result.error || response.statusText)
  }

  if (result.success && result.rentals) {
    // Convert array to Record<string, RentalData>
    const serverRentals = result.rentals as RentalData[]
    const rentalsMap: Record<string, RentalData> = {}

    serverRentals.forEach((rental) => {
      rentalsMap[rental.movieId] = {
        ...rental,
        lastSync: Date.now(),
      }
    })

    return rentalsMap
  }

  throw new Error("Invalid response format")
}

export const useRentalStore = createCachedStore<
  Record<string, RentalData>,
  RentalStore
>({
  name: "warecast-rentals",
  cacheDuration: 10 * 60 * 1000, // 10 minutes
  partializeFields: ["data", "lastFetch", "currentUserId"],

  initialState: () => ({}),

  fetchData: fetchUserRentals,

  storeActions: (set, get) => ({
    getRentalData: (movieId: string) => {
      return get().data[movieId] || { ...defaultRentalData, movieId }
    },

    setRentalData: (movieId: string, data: Partial<RentalData>) => {
      set({
        data: {
          ...get().data,
          [movieId]: {
            ...get().data[movieId],
            movieId,
            ...data,
          },
        },
      })
    },

    refreshRental: async (movieId: string) => {
      const { setRentalData } = get()

      set({ loading: true })

      try {
        const response = await fetch(`/api/movie-rental-status/${movieId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          if (response.status === 401) {
            setRentalData(movieId, {
              isRented: false,
              rentalId: null,
              expiresAt: null,
              lastSync: Date.now(),
            })
            return
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        setRentalData(movieId, {
          isRented: data.isCurrentlyRented,
          rentalId: data.rentalId || null,
          expiresAt: null,
          lastSync: Date.now(),
        })
      } catch (error) {
        console.error(`Failed to refresh rental for movie ${movieId}:`, error)
        // Don't update the data if fetch fails
      } finally {
        set({ loading: false })
      }
    },
  }),
})

// Hook for components with hydration handling
export const useMovieRentalStore = (movieId: string) => {
  const [isHydrated, setIsHydrated] = React.useState(false)
  const { user } = useAuth()

  const {
    getRentalData,
    isLoading,
    fetchData: fetchUserRentals,
    needsRefresh,
    initializing,
    checkUserChanged,
  } = useRentalStore()

  const rentalData = getRentalData(movieId)
  const loading = isLoading()
  const userId = user?.id || null

  // Track hydration status
  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  // OPTIMIZATION: Auto-fetch user rentals si nécessaire (-95% requêtes inutiles au montage)
  React.useEffect(() => {
    if (!isHydrated) return

    const userChanged = checkUserChanged(userId)
    const shouldRefresh = needsRefresh() // Appelé 1 seule fois hors deps

    if (userChanged || shouldRefresh) {
      fetchUserRentals(userId)
    }
  }, [isHydrated, userId, fetchUserRentals, checkUserChanged])
  // OPTIMIZATION: Retirer needsRefresh des dépendances pour éviter boucles infinies

  return {
    isCurrentlyRented: rentalData.isRented,
    rentalId: rentalData.rentalId,
    expiresAt: rentalData.expiresAt,
    loading: loading || !isHydrated,
    isHydrated,
  }
}
