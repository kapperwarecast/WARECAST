'use client'

import { useState, useCallback, useEffect } from 'react'
import type { DirectorWithMovieCount } from '@/types/director'
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

interface DirectorsResponse {
  directors: DirectorWithMovieCount[]
  pagination: PaginationInfo
}

interface UseInfiniteDirectorsReturn {
  directors: DirectorWithMovieCount[]
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

export function useInfiniteDirectors(initialLimit = 20, externalSearchQuery?: string): UseInfiniteDirectorsReturn {
  const { updateFiltersState } = useFiltersModal()
  const [directors, setDirectors] = useState<DirectorWithMovieCount[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // State for filters and sorting (only decade and language matter for directors)
  const [filters, setFilters] = useState<Filters>({
    genres: [], // Not used for directors but kept for interface consistency
    decade: '',
    language: '',
    availableOnly: false // Not used for directors but kept for interface consistency
  })

  const [sort, setSort] = useState<Sort>({
    by: 'random',
    order: 'desc'
  })

  // Use external search query if provided, otherwise empty (search is managed by navbar for directors)
  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : ''

  const buildQueryParams = useCallback((page: number, currentFilters: Filters, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: initialLimit.toString(),
    })

    if (search && search.trim()) {
      params.append('search', search.trim())
    }

    // Add decade and language filters (genres and availableOnly are not used for directors)
    if (currentFilters.decade) {
      params.append('decade', currentFilters.decade)
    }
    if (currentFilters.language) {
      params.append('language', currentFilters.language)
    }

    return params.toString()
  }, [initialLimit])

  const fetchDirectors = useCallback(async (page: number, append = false, currentFilters?: Filters) => {
    try {
      if (!append) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      // Use current filters if not provided
      const activeFilters = currentFilters ?? filters

      const queryParams = buildQueryParams(page, activeFilters, activeSearchQuery)
      const response = await fetch(`/api/directors?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const data: DirectorsResponse = await response.json()

      if (!data.directors || !Array.isArray(data.directors)) {
        throw new Error('Format de données invalide')
      }

      if (append) {
        setDirectors(prev => {
          const existingIds = new Set(prev.map(director => director.id))
          const newDirectors = data.directors.filter(director => !existingIds.has(director.id))
          return [...prev, ...newDirectors]
        })
      } else {
        setDirectors(data.directors)
      }

      setPagination(data.pagination)
      setCurrentPage(page)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement des réalisateurs'
      setError(errorMessage)
      console.error('Error fetching directors:', err)

      if (!append) {
        setDirectors([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters, activeSearchQuery, buildQueryParams])

  const loadMore = useCallback(async () => {
    if (!pagination?.hasNextPage || loadingMore) {
      return
    }

    const nextPage = currentPage + 1
    await fetchDirectors(nextPage, true)
  }, [pagination?.hasNextPage, loadingMore, currentPage, fetchDirectors])

  const refresh = useCallback(async () => {
    setCurrentPage(1)
    await fetchDirectors(1, false)
  }, [fetchDirectors])

  const applyFilters = useCallback(async (newFilters: Filters, newSort: Sort) => {
    setFilters(newFilters)
    setSort(newSort)
    setCurrentPage(1)
    updateFiltersState(newFilters, newSort)
    await fetchDirectors(1, false, newFilters)
  }, [fetchDirectors, updateFiltersState])

  const resetFilters = useCallback(async () => {
    const defaultFilters: Filters = {
      genres: [],
      decade: '',
      language: '',
      availableOnly: false
    }
    const defaultSort: Sort = {
      by: 'random',
      order: 'desc'
    }

    setFilters(defaultFilters)
    setSort(defaultSort)
    setCurrentPage(1)
    updateFiltersState(defaultFilters, defaultSort)
    await fetchDirectors(1, false, defaultFilters)
  }, [fetchDirectors, updateFiltersState])

  // Initial load
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized) {
      updateFiltersState(filters, sort)
      fetchDirectors(1, false)
      setInitialized(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // React to search query changes
  useEffect(() => {
    if (initialized) {
      setCurrentPage(1)
      fetchDirectors(1, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearchQuery])

  return {
    directors,
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
