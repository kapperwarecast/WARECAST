"use client"

import { createContext, useContext, useState, ReactNode, useMemo } from 'react'

export interface Filters {
  genres: string[]
  decade: string
  language: string
  availableOnly: boolean
}

export interface Sort {
  by: 'created_at' | 'titre_francais' | 'annee_sortie' | 'note_tmdb' | 'random'
  order: 'asc' | 'desc'
}

interface FiltersContextType {
  isFiltersModalOpen: boolean
  openFiltersModal: () => void
  closeFiltersModal: () => void
  setFiltersModalOpen: (open: boolean) => void
  hasActiveFilters: boolean
  updateFiltersState: (filters: Filters, sort: Sort) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchBarOpen: boolean
  toggleSearchBar: () => void
  closeSearchBar: () => void
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

export function useFiltersModal() {
  const context = useContext(FiltersContext)
  if (context === undefined) {
    throw new Error('useFiltersModal must be used within a FiltersProvider')
  }
  return context
}

interface FiltersProviderProps {
  children: ReactNode
}

export function FiltersProvider({ children }: FiltersProviderProps) {
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
  const [currentFilters, setCurrentFilters] = useState<Filters>({
    genres: [],
    decade: '',
    language: '',
    availableOnly: false
  })
  const [currentSort, setCurrentSort] = useState<Sort>({
    by: 'random',
    order: 'desc'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchBarOpen, setSearchBarOpen] = useState(false)

  const openFiltersModal = () => setIsFiltersModalOpen(true)
  const closeFiltersModal = () => setIsFiltersModalOpen(false)
  const setFiltersModalOpen = (open: boolean) => setIsFiltersModalOpen(open)

  const toggleSearchBar = () => setSearchBarOpen(prev => !prev)
  const closeSearchBar = () => {
    setSearchBarOpen(false)
    setSearchQuery('')
  }

  const updateFiltersState = (filters: Filters, sort: Sort) => {
    setCurrentFilters(filters)
    setCurrentSort(sort)
  }

  // Déterminer si des filtres ou tri sont actifs - memoized
  // Note: 'random' est considéré comme l'état par défaut (pas un filtre actif)
  const hasActiveFilters = useMemo(() =>
    currentFilters.genres.length > 0 ||
    currentFilters.decade !== '' ||
    currentFilters.language !== '' ||
    currentFilters.availableOnly ||
    (currentSort.by !== 'random' && currentSort.by !== 'created_at') ||
    currentSort.order !== 'desc'
  , [currentFilters, currentSort])

  const value = useMemo(() => ({
    isFiltersModalOpen,
    openFiltersModal,
    closeFiltersModal,
    setFiltersModalOpen,
    hasActiveFilters,
    updateFiltersState,
    searchQuery,
    setSearchQuery,
    searchBarOpen,
    toggleSearchBar,
    closeSearchBar,
  }), [isFiltersModalOpen, hasActiveFilters, searchQuery, searchBarOpen])

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  )
}