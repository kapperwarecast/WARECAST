"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

export interface Filters {
  genres: string[]
  decade: string
  language: string
}

export interface Sort {
  by: 'created_at' | 'titre_francais' | 'annee_sortie' | 'note_tmdb'
  order: 'asc' | 'desc'
}

interface FiltersContextType {
  isFiltersModalOpen: boolean
  openFiltersModal: () => void
  closeFiltersModal: () => void
  setFiltersModalOpen: (open: boolean) => void
  hasActiveFilters: boolean
  updateFiltersState: (filters: Filters, sort: Sort) => void
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
    language: ''
  })
  const [currentSort, setCurrentSort] = useState<Sort>({
    by: 'created_at',
    order: 'desc'
  })

  const openFiltersModal = () => setIsFiltersModalOpen(true)
  const closeFiltersModal = () => setIsFiltersModalOpen(false)
  const setFiltersModalOpen = (open: boolean) => setIsFiltersModalOpen(open)

  const updateFiltersState = (filters: Filters, sort: Sort) => {
    setCurrentFilters(filters)
    setCurrentSort(sort)
  }

  // Déterminer si des filtres ou tri sont actifs
  const hasActiveFilters = 
    currentFilters.genres.length > 0 ||
    currentFilters.decade !== '' ||
    currentFilters.language !== '' ||
    currentSort.by !== 'created_at' ||
    currentSort.order !== 'desc'

  return (
    <FiltersContext.Provider
      value={{
        isFiltersModalOpen,
        openFiltersModal,
        closeFiltersModal,
        setFiltersModalOpen,
        hasActiveFilters,
        updateFiltersState,
      }}
    >
      {children}
    </FiltersContext.Provider>
  )
}