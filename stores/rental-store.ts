"use client"

import React from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useAuth } from "@/contexts/auth-context"

interface RentalData {
  movieId: string
  isRented: boolean
  rentalId: string | null
  expiresAt: string | null
  lastSync: number
}

interface RentalStore {
  rentals: Record<string, RentalData>
  loading: boolean
  initializing: boolean
  lastUserFetch: number
  currentUserId: string | null

  // Actions
  setRentalData: (movieId: string, data: Partial<RentalData>) => void
  fetchUserRentals: (userId?: string | null) => Promise<void>
  refreshRental: (movieId: string) => Promise<void>
  clearUserData: () => void
  checkUserChanged: (userId: string | null) => boolean

  // Getters
  getRentalData: (movieId: string) => RentalData
  isLoading: () => boolean
  needsInitialFetch: () => boolean
}

const defaultRentalData: RentalData = {
  movieId: "",
  isRented: false,
  rentalId: null,
  expiresAt: null,
  lastSync: 0,
}

export const useRentalStore = create<RentalStore>()(
  persist(
    (set, get) => ({
      rentals: {},
      loading: false,
      initializing: false,
      lastUserFetch: 0,
      currentUserId: null,

      getRentalData: (movieId: string) => {
        return get().rentals[movieId] || { ...defaultRentalData, movieId }
      },

      isLoading: () => {
        return get().loading || get().initializing
      },

      needsInitialFetch: () => {
        const { lastUserFetch } = get()
        // Fetch if never fetched or fetch is older than 10 minutes
        return lastUserFetch === 0 || (Date.now() - lastUserFetch) > 10 * 60 * 1000
      },

      clearUserData: () => {
        set({
          rentals: {},
          lastUserFetch: 0,
          currentUserId: null,
        })
      },

      checkUserChanged: (userId: string | null) => {
        const { currentUserId } = get()
        return currentUserId !== userId
      },

      setRentalData: (movieId: string, data: Partial<RentalData>) => {
        set((state) => ({
          rentals: {
            ...state.rentals,
            [movieId]: {
              ...state.rentals[movieId],
              movieId,
              ...data,
            },
          },
        }))
      },

      fetchUserRentals: async (userId?: string | null) => {
        const { initializing, setRentalData, checkUserChanged, clearUserData } = get()

        // Check if user changed - if so, clear cache and force refresh
        if (userId !== undefined && checkUserChanged(userId)) {
          console.log(`Rental store: User changed (${get().currentUserId} → ${userId}), clearing cache`)
          clearUserData()
          set({ currentUserId: userId })
        }

        // Prevent concurrent fetches
        if (initializing) return

        set({ initializing: true })

        try {
          const response = await fetch("/api/rentals", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          })

          // Always parse the JSON response first
          const result = await response.json()

          // If unauthorized, silently fail (user not logged in) - NOT an error!
          if (response.status === 401) {
            // User not logged in - clear data and update userId
            clearUserData()
            set({ initializing: false, lastUserFetch: Date.now(), currentUserId: null })
            return
          }

          // Other errors
          if (!response.ok) {
            console.warn("Error fetching rentals:", result.error || response.statusText)
            set({ initializing: false, lastUserFetch: Date.now() })
            return
          }

          if (result.success && result.rentals) {
            // Clear old rentals and set new ones
            const serverRentals = result.rentals as RentalData[]

            // Reset all rentals to not rented
            const currentRentals = get().rentals
            Object.keys(currentRentals).forEach((movieId) => {
              setRentalData(movieId, {
                isRented: false,
                rentalId: null,
                expiresAt: null,
                lastSync: Date.now(),
              })
            })

            // Update with server data
            serverRentals.forEach((rental) => {
              setRentalData(rental.movieId, {
                isRented: rental.isRented,
                rentalId: rental.rentalId,
                expiresAt: rental.expiresAt,
                lastSync: Date.now(),
              })
            })

            // Update last fetch time and userId
            set({ lastUserFetch: Date.now(), currentUserId: userId || null })
          }
        } catch (error) {
          // Network error or parsing error - fail silently
          console.debug("Rental store: Could not fetch rentals (network or parsing error)")
          // Don't throw - fail silently to not break the app
        } finally {
          set({ initializing: false })
        }
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
    {
      name: "warecast-rentals",
      partialize: (state) => ({
        rentals: state.rentals,
        lastUserFetch: state.lastUserFetch,
        currentUserId: state.currentUserId,
      }),
    }
  )
)

// Hook for components with hydration handling
export const useMovieRentalStore = (movieId: string) => {
  const [isHydrated, setIsHydrated] = React.useState(false)
  const { user } = useAuth()

  const {
    getRentalData,
    isLoading,
    fetchUserRentals,
    needsInitialFetch,
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

  // Auto-fetch user rentals if needed (only after hydration)
  // Also force fetch if user changed
  React.useEffect(() => {
    const userChanged = checkUserChanged(userId)
    const shouldFetch = isHydrated && (needsInitialFetch() || userChanged) && !initializing

    if (shouldFetch) {
      // Small delay to ensure hydration is complete
      const timer = setTimeout(() => {
        fetchUserRentals(userId)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isHydrated, needsInitialFetch, fetchUserRentals, initializing, userId, checkUserChanged])

  return {
    isCurrentlyRented: rentalData.isRented,
    rentalId: rentalData.rentalId,
    expiresAt: rentalData.expiresAt,
    loading: loading || !isHydrated,
    isHydrated,
  }
}

// Network resilience - Auto-refresh when coming online
if (typeof window !== "undefined") {
  const handleOnline = () => {
    useRentalStore.getState().fetchUserRentals()
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      const { needsInitialFetch, fetchUserRentals } = useRentalStore.getState()
      if (needsInitialFetch()) {
        fetchUserRentals()
      }
    }
  }

  window.addEventListener("online", handleOnline)
  document.addEventListener("visibilitychange", handleVisibilityChange)
}