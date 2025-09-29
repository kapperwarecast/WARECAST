"use client"

import { useState } from "react"
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect"

/**
 * Hook to handle hydration state - version simplifiée
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useIsomorphicLayoutEffect(() => {
    setIsHydrated(true)
  }, [])

  return { isHydrated }
}