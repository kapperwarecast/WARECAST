"use client"

import { useState } from "react"
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect"
import { ANIMATION_DURATIONS } from "@/constants"

interface UseHydrationOptions {
  /**
   * Delay before marking as hydrated (in milliseconds)
   * Useful for ensuring store hydration is complete
   */
  delay?: number

  /**
   * Whether to use a delay or mark as hydrated immediately
   */
  immediate?: boolean
}

/**
 * Hook to handle hydration state consistently across components
 * Prevents hydration mismatches by providing a reliable hydrated state
 */
export function useHydration(options: UseHydrationOptions = {}) {
  const { delay = ANIMATION_DURATIONS.HYDRATION_DELAY, immediate = false } = options
  const [isHydrated, setIsHydrated] = useState(false)

  useIsomorphicLayoutEffect(() => {
    if (immediate) {
      setIsHydrated(true)
    } else {
      // Small delay to ensure store hydration is complete
      const timer = setTimeout(() => {
        setIsHydrated(true)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [delay, immediate])

  return {
    isHydrated,

    // Utility for conditional rendering
    renderWhenHydrated: (children: React.ReactNode, fallback: React.ReactNode = null) =>
      isHydrated ? children : fallback,
  }
}