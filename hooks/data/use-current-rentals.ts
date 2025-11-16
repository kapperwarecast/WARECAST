'use client'

import React, { useState, useCallback } from 'react'
import type { MovieWithDirector } from '@/types/movie'

/**
 * DEPRECATED: Ce hook est obsolète dans le système de propriété
 *
 * L'ancien système de location (emprunts) a été remplacé par le système de propriété.
 * La page /films-en-cours redirige maintenant vers /ma-collection
 *
 * Pour obtenir les films possédés, utilisez:
 * - useUserFilms() pour la page Ma Collection
 * - useRentalStore() pour vérifier la propriété d'un film spécifique
 *
 * Ce hook est conservé pour compatibilité mais retourne des données vides.
 * L'API /api/current-rentals retourne également des données vides.
 */

interface RentalInfo {
  id: string
  date_emprunt: string
  date_retour: string
  statut: 'en_cours' | 'rendu' | 'en_retard'
  montant_paye: number
  type_emprunt: 'unitaire' | 'abonnement'
}

interface MovieWithRental extends MovieWithDirector {
  rental: RentalInfo
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface CurrentRentalsResponse {
  movies: MovieWithRental[]
  pagination: PaginationInfo
  deprecated?: boolean
  message?: string
}

interface UseCurrentRentalsReturn {
  movies: MovieWithRental[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  pagination: PaginationInfo | null
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * @deprecated Utilisez useUserFilms() à la place. Ce hook retourne des données vides.
 */
export function useCurrentRentals(initialLimit = 20): UseCurrentRentalsReturn {
  const [movies, setMovies] = useState<MovieWithRental[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchCurrentRentals = useCallback(async (page: number, append = false) => {
    try {
      if (!append) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: initialLimit.toString()
      })

      const response = await fetch(`/api/current-rentals?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        // Cache court pour améliorer la réactivité
        next: { revalidate: 30 }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Redirection vers login pour non authentifiés
          window.location.href = '/auth/login'
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CurrentRentalsResponse = await response.json()

      if (append) {
        setMovies(prev => {
          // Créer un Set des IDs existants pour éviter les doublons
          const existingIds = new Set(prev.map(movie => movie.id))
          const newMovies = data.movies.filter(movie => !existingIds.has(movie.id))
          return [...prev, ...newMovies]
        })
      } else {
        setMovies(data.movies)
      }

      setPagination(data.pagination)
      setCurrentPage(page)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch current rentals'
      setError(errorMessage)
      console.error('Error fetching current rentals:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [initialLimit])

  const loadMore = useCallback(async () => {
    if (!pagination?.hasNextPage || loadingMore) {
      return
    }

    const nextPage = currentPage + 1
    await fetchCurrentRentals(nextPage, true)
  }, [pagination?.hasNextPage, loadingMore, currentPage, fetchCurrentRentals])

  const refresh = useCallback(async () => {
    setCurrentPage(1)
    await fetchCurrentRentals(1, false)
  }, [fetchCurrentRentals])

  // Initial load - une seule fois au montage
  const [initialized, setInitialized] = React.useState(false)
  
  React.useEffect(() => {
    if (!initialized) {
      fetchCurrentRentals(1, false)
      setInitialized(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    movies,
    loading,
    loadingMore,
    error,
    pagination,
    loadMore,
    refresh,
  }
}