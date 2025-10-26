'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  onLoadMore: () => void
  hasNextPage: boolean
  loading: boolean
  rootMargin?: string
  threshold?: number
}

export function useInfiniteScroll({
  onLoadMore,
  hasNextPage,
  loading,
  rootMargin = '300px',
  threshold = 0.1
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0]
    
    // Si l'élément sentinel est visible et qu'on peut charger plus
    if (target.isIntersecting && hasNextPage && !loading) {
      onLoadMore()
    }
  }, [onLoadMore, hasNextPage, loading])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    // Créer l'observer avec les options
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null, // viewport
      rootMargin,
      threshold
    })

    // Observer l'élément sentinel
    observerRef.current.observe(sentinel)

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleIntersection, rootMargin, threshold])

  return { sentinelRef }
}