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
  
  // State for filters and sorting
  const [filters, setFilters] = useState<Filters>({
    genres: [],
    decade: '',
    language: ''
  })
  
  const [sort, setSort] = useState<Sort>({
    by: 'created_at',
    order: 'desc'
  })

  const buildQueryParams = useCallback((page: number, currentFilters: Filters, currentSort: Sort) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: initialLimit.toString(),
      sortBy: currentSort.by,
      sortOrder: currentSort.order
    })

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
  }, [initialLimit])

  const fetchMovies = useCallback(async (page: number, append = false, currentFilters = filters, currentSort = sort) => {
    try {
      if (!append) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const queryParams = buildQueryParams(page, currentFilters, currentSort)
      const response = await fetch(`/api/movies?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

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
      by: 'created_at',
      order: 'desc'
    }
    
    setFilters(defaultFilters)
    setSort(defaultSort)
    setCurrentPage(1)
    updateFiltersState(defaultFilters, defaultSort)
    await fetchMovies(1, false, defaultFilters, defaultSort)
  }, [fetchMovies, updateFiltersState])

  // Synchroniser le contexte avec l'état initial
  useEffect(() => {
    updateFiltersState(filters, sort)
  }, [filters, sort, updateFiltersState])

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
    filters,
    sort,
    loadMore,
    refresh,
    applyFilters,
    resetFilters,
  }
}