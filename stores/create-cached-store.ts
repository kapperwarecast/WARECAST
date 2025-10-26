"use client"

import { create, StateCreator } from "zustand"
import { persist, PersistOptions } from "zustand/middleware"

/**
 * Configuration for creating a cached store
 */
export interface CachedStoreConfig<T, TState> {
  /**
   * Name for localStorage persistence
   */
  name: string

  /**
   * Cache duration in milliseconds (default: 10 minutes)
   */
  cacheDuration?: number

  /**
   * Fields to persist in localStorage
   */
  partializeFields: (keyof TState)[]

  /**
   * Initial state factory
   */
  initialState: (userId: string | null) => T

  /**
   * Custom store actions and getters
   */
  storeActions: (
    set: (partial: Partial<TState>) => void,
    get: () => TState
  ) => Omit<
    TState,
    | "data"
    | "loading"
    | "initializing"
    | "lastFetch"
    | "currentUserId"
    | "clearUserData"
    | "checkUserChanged"
    | "isLoading"
    | "needsRefresh"
    | "fetchData"
  >

  /**
   * Fetch function to load data from API
   */
  fetchData: (userId: string | null) => Promise<T>

  /**
   * Optional: Called when user changes (before clearing cache)
   */
  onUserChange?: (oldUserId: string | null, newUserId: string | null) => void

  /**
   * Optional: Called when data is successfully fetched
   */
  onFetchSuccess?: (data: T) => void

  /**
   * Optional: Called when fetch fails
   */
  onFetchError?: (error: unknown) => void
}

/**
 * Base store interface with common cached store functionality
 */
export interface BaseCachedStore<T> {
  data: T
  loading: boolean
  initializing: boolean
  lastFetch: number
  currentUserId: string | null

  // Actions
  clearUserData: () => void
  checkUserChanged: (userId: string | null) => boolean
  fetchData: (userId?: string | null) => Promise<void>

  // Getters
  isLoading: () => boolean
  needsRefresh: () => boolean
}

/**
 * Factory function to create a cached Zustand store with user tracking and persistence
 */
export function createCachedStore<T, TState extends BaseCachedStore<T>>(
  config: CachedStoreConfig<T, TState>
) {
  const {
    name,
    cacheDuration = 10 * 60 * 1000, // 10 minutes default
    partializeFields,
    initialState,
    storeActions,
    fetchData,
    onUserChange,
    onFetchSuccess,
    onFetchError,
  } = config

  type StoreType = TState

  const storeCreator: StateCreator<StoreType, [], [], StoreType> = (set, get) => {
    const baseStore: BaseCachedStore<T> = {
      data: initialState(null),
      loading: false,
      initializing: false,
      lastFetch: 0,
      currentUserId: null,

      isLoading: () => {
        return get().loading || get().initializing
      },

      needsRefresh: () => {
        const { lastFetch } = get()
        return lastFetch === 0 || Date.now() - lastFetch > cacheDuration
      },

      clearUserData: () => {
        set({
          data: initialState(null),
          lastFetch: 0,
          currentUserId: null,
        } as Partial<StoreType>)
      },

      checkUserChanged: (userId: string | null) => {
        const { currentUserId } = get()
        return currentUserId !== userId
      },

      fetchData: async (userId?: string | null) => {
        const { initializing, checkUserChanged, clearUserData } = get()

        // Check if user changed - if so, clear cache and force refresh
        if (userId !== undefined && checkUserChanged(userId)) {
          if (onUserChange) {
            onUserChange(get().currentUserId, userId)
          }
          console.log(`${name}: User changed, clearing cache`)
          clearUserData()
          set({ currentUserId: userId } as Partial<StoreType>)
        }

        // Prevent concurrent fetches
        if (initializing) return

        // If not logged in, clear data
        if (!userId) {
          clearUserData()
          return
        }

        set({ initializing: true } as Partial<StoreType>)

        try {
          const data = await fetchData(userId)

          set({
            data,
            lastFetch: Date.now(),
            currentUserId: userId,
          } as Partial<StoreType>)

          if (onFetchSuccess) {
            onFetchSuccess(data)
          }
        } catch (error) {
          console.debug(`${name}: Could not fetch data`, error)
          if (onFetchError) {
            onFetchError(error)
          }
        } finally {
          set({ initializing: false } as Partial<StoreType>)
        }
      },
    }

    const customActions = storeActions(
      (partial) => set(partial as Partial<StoreType>),
      get
    )

    return {
      ...baseStore,
      ...customActions,
    } as StoreType
  }

  // Create persist config
  const persistConfig: PersistOptions<StoreType> = {
    name,
    partialize: (state) => {
      const result: Partial<StoreType> = {}
      partializeFields.forEach((field) => {
        result[field] = state[field]
      })
      return result as StoreType
    },
  }

  // Create the store with persistence
  const useStore = create<StoreType>()(persist(storeCreator, persistConfig))

  // Network resilience - Auto-refresh when coming online
  // Use a unique symbol to prevent duplicate listeners in dev mode (HMR)
  if (typeof window !== "undefined") {
    const listenerKey = `__cached_store_${name}_listeners`

    // Only add listeners once per store name
    if (!(window as any)[listenerKey]) {
      const handleOnline = () => {
        useStore.getState().fetchData()
      }

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          const { needsRefresh, fetchData } = useStore.getState()
          if (needsRefresh()) {
            fetchData()
          }
        }
      }

      window.addEventListener("online", handleOnline)
      document.addEventListener("visibilitychange", handleVisibilityChange)

      // Mark that listeners have been added
      ;(window as any)[listenerKey] = true
    }
  }

  return useStore
}
