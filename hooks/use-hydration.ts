"use client"

import { useState, ReactNode } from "react"
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect"

interface UseHydrationOptions {
  immediate?: boolean
}

/**
 * Hook to handle hydration state
 */
export function useHydration({ immediate = true }: UseHydrationOptions = {}) {
  const [isHydrated, setIsHydrated] = useState(immediate)

  useIsomorphicLayoutEffect(() => {
    if (!immediate) {
      setIsHydrated(true)
    }
  }, [immediate])

  const renderWhenHydrated = (children: ReactNode, fallback: ReactNode = null) => {
    return isHydrated ? children : fallback
  }

  return { isHydrated, renderWhenHydrated }
}