"use client"

import React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useUserFilmsStore } from "@/stores/user-films-store"
import type { UserFilm } from "@/types/ownership"

interface UseUserFilmsReturn {
  // Data
  films: UserFilm[]
  loading: boolean
  isHydrated: boolean

  // Getters
  filmCount: number
  blurayFilms: UserFilm[]
  dvdFilms: UserFilm[]
  hasFilm: (registryId: string) => boolean
  getFilmsByAcquisition: (method: string) => UserFilm[]

  // Actions
  refreshFilms: () => Promise<void>
}

/**
 * Hook pour accéder aux films possédés par l'utilisateur
 * Utilise le store avec cache et auto-refresh
 */
export function useUserFilms(): UseUserFilmsReturn {
  const [isHydrated, setIsHydrated] = React.useState(false)
  const { user } = useAuth()

  const {
    data: films,
    getFilmCount,
    getFilmsBySupport,
    getFilmsByAcquisition,
    hasFilm,
    isLoading,
    fetchData,
    needsRefresh,
    initializing,
    checkUserChanged,
  } = useUserFilmsStore()

  const loading = isLoading()
  const userId = user?.id || null

  // Track hydration status
  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Auto-fetch user films if needed (only after hydration)
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

  // Wrapper pour refreshFilms
  const refreshFilms = React.useCallback(async () => {
    await fetchData(userId)
  }, [fetchData, userId])

  return {
    films,
    loading: loading || !isHydrated,
    isHydrated,
    filmCount: getFilmCount(),
    blurayFilms: getFilmsBySupport("Blu-ray"),
    dvdFilms: getFilmsBySupport("DVD"),
    hasFilm,
    getFilmsByAcquisition,
    refreshFilms,
  }
}
