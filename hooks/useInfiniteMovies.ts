'use client'

import React, { useState, useCallback, useEffect } from 'react'
import type { MovieWithDirector } from '@/types/movie'
import { useFiltersModal } from '@/contexts/filters-context'
import type { Filters, Sort } from '@/contexts/filters-context'


interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface MoviesResponse {
  movies: MovieWithDirector[]
  pagination: PaginationInfo
}

interface UseInfiniteMoviesReturn {
  movies: MovieWithDirector[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  pagination: PaginationInfo | null
  filters: Filters
  sort: Sort
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  applyFilters: (newFilters: Filters, newSort: Sort) => Promise<void>
  resetFilters: () => Promise<void>
}

export function useInfiniteMovies(initialLimit = 20): UseInfiniteMoviesReturn {
  const { updateFiltersState } = useFiltersModal()
  const [movies, setMovies] = useState<MovieWithDirector[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Random seed pour l'ordre aléatoire - généré une seule fois au montage
  const [randomSeed] = useState(() => Math.random().toString(36).substring(7))

  // State for filters and sorting
  const [filters, setFilters] = useState<Filters>({
    genres: [],
    decade: '',
    language: ''
  })

  const [sort, setSort] = useState<Sort>({
    by: 'random',
    order: 'desc'
  })

  const buildQueryParams = useCallback((page: number, currentFilters: Filters, currentSort: Sort) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: initialLimit.toString(),
      sortBy: currentSort.by,
      sortOrder: currentSort.order
    })

    // Ajouter le seed aléatoire pour le tri random
    if (currentSort.by === 'random') {
      params.append('randomSeed', randomSeed)
    }

    if (currentFilters.genres.length > 0) {
      params.append('genres', currentFilters.genres.join(','))
    }
    if (currentFilters.decade) {
      params.append('decade', currentFilters.decade)
    }
    if (currentFilters.language) {
      params.append('language', currentFilters.language)
    }

    return params.toString()
  }, [initialLimit, randomSeed])

  const fetchMovies = useCallback(async (page: number, append = false, currentFilters?: Filters, currentSort?: Sort) => {
    try {
      if (!append) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      // Utiliser les filtres actuels si non fournis
      const activeFilters = currentFilters ?? filters
      const activeSort = currentSort ?? sort

      const queryParams = buildQueryParams(page, activeFilters, activeSort)
      const response = await fetch(`/api/movies?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        // Désactiver le cache pour les données sensibles à la pagination
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const data: MoviesResponse = await response.json()
      
      // Validation des données reçues
      if (!data.movies || !Array.isArray(data.movies)) {
        throw new Error('Format de données invalide')
      }
      
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
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement des films'
      setError(errorMessage)
      console.error('Error fetching movies:', err)
      
      // En cas d'erreur lors d'un append, on garde les films existants
      if (!append) {
        setMovies([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters, sort, buildQueryParams])

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

  const applyFilters = useCallback(async (newFilters: Filters, newSort: Sort) => {
    setFilters(newFilters)
    setSort(newSort)
    setCurrentPage(1)
    updateFiltersState(newFilters, newSort)
    await fetchMovies(1, false, newFilters, newSort)
  }, [fetchMovies, updateFiltersState])

  const resetFilters = useCallback(async () => {
    const defaultFilters: Filters = {
      genres: [],
      decade: '',
      language: ''
    }
    const defaultSort: Sort = {
      by: 'random',
      order: 'desc'
    }
    
    setFilters(defaultFilters)
    setSort(defaultSort)
    setCurrentPage(1)
    updateFiltersState(defaultFilters, defaultSort)
    await fetchMovies(1, false, defaultFilters, defaultSort)
  }, [fetchMovies, updateFiltersState])

  // Initial load - une seule fois au montage
  const [initialized, setInitialized] = useState(false)
  
  React.useEffect(() => {
    if (!initialized) {
      updateFiltersState(filters, sort)
      fetchMovies(1, false)
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
    filters,
    sort,
    loadMore,
    refresh,
    applyFilters,
    resetFilters,
  }
}