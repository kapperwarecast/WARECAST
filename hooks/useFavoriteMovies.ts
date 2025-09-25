'use client'

import React, { useState, useCallback, useEffect } from 'react'
import type { MovieWithDirector } from '@/types/movie'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface FavoritesResponse {
  movies: MovieWithDirector[]
  pagination: PaginationInfo
}

interface UseFavoriteMoviesReturn {
  movies: MovieWithDirector[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  pagination: PaginationInfo | null
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useFavoriteMovies(initialLimit = 20): UseFavoriteMoviesReturn {
  const [movies, setMovies] = useState<MovieWithDirector[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchFavorites = useCallback(async (page: number, append = false) => {
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

      const response = await fetch(`/api/favorites?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Vous devez être connecté pour voir vos favoris')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: FavoritesResponse = await response.json()

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch favorite movies'
      setError(errorMessage)
      console.error('Error fetching favorite movies:', err)
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
    await fetchFavorites(nextPage, true)
  }, [pagination?.hasNextPage, loadingMore, currentPage, fetchFavorites])

  const refresh = useCallback(async () => {
    setCurrentPage(1)
    await fetchFavorites(1, false)
  }, [fetchFavorites])

  // Initial load
  React.useEffect(() => {
    fetchFavorites(1, false)
  }, [fetchFavorites])

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