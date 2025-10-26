"use client"

import { ReactNode } from "react"
import { useHydration } from "@/hooks/use-hydration"

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
  /**
   * Whether to render immediately without delay
   * Useful when store hydration is not a concern
   */
  immediate?: boolean
}

export function ClientOnly({
  children,
  fallback = null,
  immediate = true
}: ClientOnlyProps) {
  const { renderWhenHydrated } = useHydration({ immediate })

  return <>{renderWhenHydrated(children, fallback)}</>
}