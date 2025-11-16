"use client"

import { createClient } from "@/lib/supabase/client"
import { UserFilm } from "@/types/ownership"
import { createCachedStore, BaseCachedStore } from "./create-cached-store"

// ============================================================================
// TYPES
// ============================================================================

interface UserFilmsState extends BaseCachedStore<UserFilm[]> {
  // Getters
  getFilmCount: () => number
  getFilmsBySupport: (supportType: "Blu-ray" | "DVD") => UserFilm[]
  getFilmsByAcquisition: (method: string) => UserFilm[]
  hasFilm: (registryId: string) => boolean

  // Actions spécifiques
  refreshFilms: (userId: string) => Promise<void>
}

// ============================================================================
// FETCH FUNCTION
// ============================================================================

async function fetchUserFilms(userId: string | null): Promise<UserFilm[]> {
  if (!userId) return []

  const supabase = createClient()

  // Appeler la RPC function get_user_films
  const { data, error } = await supabase.rpc("get_user_films", {
    p_user_id: userId,
  })

  if (error) {
    console.error("Error fetching user films:", error)
    throw error
  }

  return data || []
}

// ============================================================================
// STORE CREATION
// ============================================================================

export const useUserFilmsStore = createCachedStore<UserFilm[], UserFilmsState>({
  name: "user-films-store",
  cacheDuration: 5 * 60 * 1000, // 5 minutes (les films changent via échanges)
  partializeFields: ["data", "lastFetch", "currentUserId"],

  initialState: () => [],

  fetchData: fetchUserFilms,

  storeActions: (set, get) => ({
    // Getters
    getFilmCount: () => {
      return get().data.length
    },

    getFilmsBySupport: (supportType: "Blu-ray" | "DVD") => {
      return get().data.filter(
        (film) => film.physical_support_type === supportType
      )
    },

    getFilmsByAcquisition: (method: string) => {
      return get().data.filter((film) => film.acquisition_method === method)
    },

    hasFilm: (registryId: string) => {
      return get().data.some((film) => film.registry_id === registryId)
    },

    // Actions
    refreshFilms: async (userId: string) => {
      await get().fetchData(userId)
    },
  }),

  onFetchSuccess: (data) => {
    console.log(`Loaded ${data.length} films for user`)
  },

  onFetchError: (error) => {
    console.error("Failed to load user films:", error)
  },
})
