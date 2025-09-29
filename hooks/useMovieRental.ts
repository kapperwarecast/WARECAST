'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface MovieRentalStatus {
  movieId: string
  isCurrentlyRented: boolean
  rentalId: string | null
}

interface UseMovieRentalReturn {
  isCurrentlyRented: boolean
  loading: boolean
  error: string | null
  unknownStatus: boolean
  refresh: () => Promise<void>
}

export function useMovieRental(movieId: string): UseMovieRentalReturn {
  const [isCurrentlyRented, setIsCurrentlyRented] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unknownStatus, setUnknownStatus] = useState(false)
  const { user } = useAuth()
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchRentalStatus = useCallback(async () => {
    // Si pas de movieId valide, ne rien faire (utilisé quand isRented est fourni en props)
    if (!movieId || movieId === '') {
      setIsCurrentlyRented(false)
      setUnknownStatus(false)
      setLoading(false)
      return
    }

    if (!user) {
      setIsCurrentlyRented(false)
      setUnknownStatus(false)
      setLoading(false)
      return
    }

    try {
      if (!isMountedRef.current) return

      setLoading(true)
      setError(null)
      setUnknownStatus(false)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(`/api/movie-rental-status/${movieId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!isMountedRef.current) return

      if (!response.ok) {
        if (response.status === 401) {
          setIsCurrentlyRented(false)
          setUnknownStatus(false)
          setLoading(false)
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: MovieRentalStatus = await response.json()
      
      if (!isMountedRef.current) return
      
      setIsCurrentlyRented(data.isCurrentlyRented)
      setUnknownStatus(false)

    } catch (err) {
      if (!isMountedRef.current) return

      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout - status unknown')
        console.warn('Movie rental status request timed out for movie:', movieId)
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rental status'
        setError(errorMessage)
        console.error('Error fetching movie rental status:', err)
      }
      setIsCurrentlyRented(false)
      setUnknownStatus(true)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [movieId, user])

  const refresh = useCallback(async () => {
    await fetchRentalStatus()
  }, [fetchRentalStatus])

  useEffect(() => {
    fetchRentalStatus()
  }, [fetchRentalStatus])

  return {
    isCurrentlyRented,
    loading,
    error,
    unknownStatus,
    refresh,
  }
}