"use client"

import React from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface LikeData {
  isLiked: boolean
  count: number
  lastSync: number
  pendingAction?: "like" | "unlike"
}

interface LikeStore {
  likes: Record<string, LikeData>
  loading: Record<string, boolean>
  initializing: boolean
  lastUserFetch: number

  // Actions
  toggleLike: (movieId: string) => Promise<void>
  setLikeData: (movieId: string, data: Partial<LikeData>) => void
  syncLike: (movieId: string) => Promise<void>
  syncAllPending: () => Promise<void>
  fetchUserLikes: () => Promise<void>

  // Getters
  getLikeData: (movieId: string) => LikeData
  isLoading: (movieId: string) => boolean
  needsInitialFetch: () => boolean
}

const defaultLikeData: LikeData = {
  isLiked: false,
  count: 0,
  lastSync: 0,
}

export const useLikeStore = create<LikeStore>()(
  persist(
    (set, get) => ({
      likes: {},
      loading: {},
      initializing: false,
      lastUserFetch: 0,

      getLikeData: (movieId: string) => {
        return get().likes[movieId] || defaultLikeData
      },

      isLoading: (movieId: string) => {
        return get().loading[movieId] || false
      },

      needsInitialFetch: () => {
        const { lastUserFetch } = get()
        // Fetch if never fetched or fetch is older than 5 minutes
        return lastUserFetch === 0 || (Date.now() - lastUserFetch) > 5 * 60 * 1000
      },

      setLikeData: (movieId: string, data: Partial<LikeData>) => {
        set((state) => ({
          likes: {
            ...state.likes,
            [movieId]: {
              ...state.likes[movieId],
              ...data,
            },
          },
        }))
      },

      toggleLike: async (movieId: string) => {
        const { likes, setLikeData, syncLike } = get()
        const currentData = likes[movieId] || defaultLikeData
        const newIsLiked = !currentData.isLiked

        // Optimistic update
        setLikeData(movieId, {
          isLiked: newIsLiked,
          count: currentData.count + (newIsLiked ? 1 : -1),
          pendingAction: newIsLiked ? "like" : "unlike",
        })

        // Set loading state
        set((state) => ({
          loading: { ...state.loading, [movieId]: true }
        }))

        try {
          await syncLike(movieId)
        } catch (error) {
          console.error("Failed to sync like:", error)
          // Keep optimistic update but mark as pending for retry
        } finally {
          set((state) => ({
            loading: { ...state.loading, [movieId]: false }
          }))
        }
      },

      syncLike: async (movieId: string) => {
        const { likes, setLikeData } = get()
        const likeData = likes[movieId]

        if (!likeData?.pendingAction) return

        try {
          const method = likeData.pendingAction === "like" ? "POST" : "DELETE"
          const response = await fetch(`/api/movies/${movieId}/like`, {
            method,
            headers: { "Content-Type": "application/json" },
          })

          if (!response.ok) {
            throw new Error(`Failed to ${likeData.pendingAction} movie`)
          }

          const result = await response.json()

          // Update with server response
          setLikeData(movieId, {
            isLiked: result.isLiked,
            count: result.count,
            lastSync: Date.now(),
            pendingAction: undefined,
          })
        } catch (error) {
          console.error(`Failed to sync like for movie ${movieId}:`, error)
          throw error
        }
      },

      syncAllPending: async () => {
        const { likes } = get()
        const pendingMovies = Object.entries(likes)
          .filter(([, data]) => data.pendingAction)
          .map(([movieId]) => movieId)

        const syncPromises = pendingMovies.map(movieId =>
          get().syncLike(movieId).catch(error =>
            console.error(`Failed to sync movie ${movieId}:`, error)
          )
        )

        await Promise.allSettled(syncPromises)
      },

      fetchUserLikes: async () => {
        const { initializing, setLikeData } = get()

        // Prevent concurrent fetches
        if (initializing) return

        set({ initializing: true })

        try {
          const response = await fetch("/api/likes", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          })

          if (!response.ok) {
            // If unauthorized, silently fail (user not logged in)
            if (response.status === 401) {
              return
            }
            throw new Error("Failed to fetch user likes")
          }

          const result = await response.json()

          if (result.success && result.likes) {
            // Merge server data with existing local data
            const serverLikes = result.likes as Record<string, LikeData>

            Object.entries(serverLikes).forEach(([movieId, likeData]) => {
              setLikeData(movieId, likeData)
            })

            // Update last fetch time
            set({ lastUserFetch: Date.now() })
          }
        } catch (error) {
          console.error("Failed to fetch user likes:", error)
          // Don't throw - fail silently to not break the app
        } finally {
          set({ initializing: false })
        }
      },
    }),
    {
      name: "warecast-likes",
      partialize: (state) => ({
        likes: state.likes,
        lastUserFetch: state.lastUserFetch
      }),
    }
  )
)

// Hook for components
export const useMovieLike = (movieId: string) => {
  const {
    getLikeData,
    isLoading,
    toggleLike,
    fetchUserLikes,
    needsInitialFetch,
    initializing
  } = useLikeStore()

  const likeData = getLikeData(movieId)
  const loading = isLoading(movieId)

  // Auto-fetch user likes if needed (only once per session)
  React.useEffect(() => {
    if (needsInitialFetch() && !initializing) {
      fetchUserLikes()
    }
  }, [needsInitialFetch, fetchUserLikes, initializing])

  return {
    isLiked: likeData.isLiked,
    count: likeData.count,
    loading: loading || initializing,
    hasPendingAction: !!likeData.pendingAction,
    toggle: () => toggleLike(movieId),
  }
}

// Network resilience - Auto-sync when coming online
if (typeof window !== "undefined") {
  const handleOnline = () => {
    useLikeStore.getState().syncAllPending()
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      useLikeStore.getState().syncAllPending()
    }
  }

  window.addEventListener("online", handleOnline)
  document.addEventListener("visibilitychange", handleVisibilityChange)
}