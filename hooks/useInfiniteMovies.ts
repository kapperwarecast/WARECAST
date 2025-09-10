'use client'

import React, { useState, useCallback } from 'react'
import type { Tables } from '@/lib/supabase/types'

type Movie = Tables<'movies'>

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface MoviesResponse {
  movies: Movie[]
  pagination: PaginationInfo
}

interface UseInfiniteMoviesReturn {
  movies: Movie[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  pagination: PaginationInfo | null
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useInfiniteMovies(initialLimit = 20): UseInfiniteMoviesReturn {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchMovies = useCallback(async (page: number, append = false) => {
    try {
      if (!append) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const response = await fetch(
        `/api/movies?page=${page}&limit=${initialLimit}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: MoviesResponse = await response.json()
      
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch movies'
      setError(errorMessage)
      console.error('Error fetching movies:', err)
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
    await fetchMovies(nextPage, true)
  }, [pagination?.hasNextPage, loadingMore, currentPage, fetchMovies])

  const refresh = useCallback(async () => {
    setCurrentPage(1)
    await fetchMovies(1, false)
  }, [fetchMovies])

  // Initial load
  React.useEffect(() => {
    fetchMovies(1, false)
  }, [fetchMovies])

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