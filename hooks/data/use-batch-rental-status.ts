'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface RentalStatus {
  [movieId: string]: boolean
}

interface UseBatchRentalStatusReturn {
  statuses: Map<string, boolean>
  loading: boolean
  error: string | null
  loadStatuses: (movieIds: string[]) => Promise<void>
}

export function useBatchRentalStatus(): UseBatchRentalStatusReturn {
  const { user } = useAuth()
  const [statuses, setStatuses] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const loadStatuses = useCallback(async (movieIds: string[]) => {
    if (!isMountedRef.current || movieIds.length === 0) {
      return
    }

    if (!user) {
      const newMap = new Map<string, boolean>()
      movieIds.forEach(id => newMap.set(id, false))
      setStatuses(newMap)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      if (isMountedRef.current) {
        setLoading(true)
        setError(null)
      }

      const response = await fetch('/api/batch-rental-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieIds }),
        signal: abortControllerRef.current.signal,
      })

      if (!isMountedRef.current) {
        return
      }

      if (!response.ok) {
        if (response.status === 401) {
          const newMap = new Map<string, boolean>()
          movieIds.forEach(id => newMap.set(id, false))
          setStatuses(newMap)
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!isMountedRef.current) {
        return
      }

      const newMap = new Map<string, boolean>()
      Object.entries(data.statuses).forEach(([movieId, status]: [string, any]) => {
        newMap.set(movieId, status.isCurrentlyRented)
      })
      
      setStatuses(newMap)

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to load rental statuses'
      if (isMountedRef.current) {
        setError(errorMessage)
      }
      console.error('Error loading batch rental statuses:', err)

      const newMap = new Map<string, boolean>()
      movieIds.forEach(id => newMap.set(id, false))
      setStatuses(newMap)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
      abortControllerRef.current = null
    }
  }, [user])

  return {
    statuses,
    loading,
    error,
    loadStatuses,
  }
}
