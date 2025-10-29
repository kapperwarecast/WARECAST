'use client'

import { useState, useCallback, useEffect } from 'react'
import type { DirectorWithMovieCount } from '@/types/director'

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
  searchQuery: string
  setSearchQuery: (query: string) => void
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useInfiniteDirectors(initialLimit = 20): UseInfiniteDirectorsReturn {
  const [directors, setDirectors] = useState<DirectorWithMovieCount[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  const buildQueryParams = useCallback((page: number, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: initialLimit.toString(),
    })

    if (search && search.trim()) {
      params.append('search', search.trim())
    }

    return params.toString()
  }, [initialLimit])

  const fetchDirectors = useCallback(async (page: number, append = false) => {
    try {
      if (!append) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const queryParams = buildQueryParams(page, searchQuery)
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
  }, [searchQuery, buildQueryParams])

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

  // Initial load
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized) {
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
  }, [searchQuery])

  return {
    directors,
    loading,
    loadingMore,
    error,
    pagination,
    searchQuery,
    setSearchQuery,
    loadMore,
    refresh,
  }
}
