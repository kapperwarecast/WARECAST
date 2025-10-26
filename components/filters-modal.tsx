"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, ArrowUpDown, Check, ListFilter } from "lucide-react"
import { SortAscIcon, SortDescIcon } from "@/components/icons/sort-icons"
import type { Filters, Sort } from "@/contexts/filters-context"
import { getLanguageName } from "@/lib/utils/format"

interface FiltersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: Filters
  sort: Sort
  onApplyFilters: (filters: Filters, sort: Sort) => void
  onResetFilters: () => void
}

const AVAILABLE_GENRES = [
  'Action', 'Aventure', 'Animation', 'Comédie', 'Crime', 'Documentaire',
  'Drame', 'Famille', 'Fantasy', 'Histoire', 'Horreur', 'Musique',
  'Mystère', 'Romance', 'Science-Fiction', 'Thriller', 'Guerre', 'Western'
]

const DECADES = [
  { value: '2020s', label: '2020' },
  { value: '2010s', label: '2010' },
  { value: '2000s', label: '2000' },
  { value: '1990s', label: '1990' },
  { value: '1980s', label: '1980' },
  { value: '1970s', label: '1970' },
  { value: '1960s', label: '1960' },
  { value: '1950s', label: '1950' },
  { value: '1940s', label: '1940' },
  { value: '1930s', label: '1930' },
  { value: '1920s', label: '1920' },
]

const SORT_OPTIONS = [
  { value: 'random', label: 'Aléatoire' },
  { value: 'created_at', label: 'Date d\'ajout' },
  { value: 'annee_sortie', label: 'Année de sortie' },
  { value: 'titre_francais', label: 'Titre alphabétique' },
  { value: 'note_tmdb', label: 'Note TMDB' }
]

export function FiltersModal({ 
  open, 
  onOpenChange, 
  filters, 
  sort, 
  onApplyFilters, 
  onResetFilters 
}: FiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters)
  const [localSort, setLocalSort] = useState<Sort>(sort)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([])

  // Fonction pour construire les paramètres de query pour la prévisualisation
  const buildPreviewParams = useCallback((currentFilters: Filters) => {
    const params = new URLSearchParams({
      preview: 'true'
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
    if (currentFilters.availableOnly) {
      params.append('availableOnly', 'true')
    }

    return params.toString()
  }, [])

  // Fonction de prévisualisation
  const fetchPreviewCount = useCallback(async (currentFilters: Filters) => {
    setPreviewLoading(true)
    try {
      const queryParams = buildPreviewParams(currentFilters)
      const response = await fetch(`/api/movies?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setPreviewCount(data.count)
    } catch (error) {
      console.error('Error fetching preview count:', error)
      setPreviewCount(null)
    } finally {
      setPreviewLoading(false)
    }
  }, [buildPreviewParams])

  // Debounced preview function
  const debouncedPreview = useCallback(
    (currentFilters: Filters) => {
      const timeoutId = setTimeout(() => {
        fetchPreviewCount(currentFilters)
      }, 300)
      return () => clearTimeout(timeoutId)
    },
    [fetchPreviewCount]
  )

  const handleGenreToggle = (genre: string) => {
    const newFilters = {
      ...localFilters,
      genres: localFilters.genres.includes(genre)
        ? localFilters.genres.filter(g => g !== genre)
        : [...localFilters.genres, genre]
    }
    setLocalFilters(newFilters)
    debouncedPreview(newFilters)
  }

  const handleApply = () => {
    onApplyFilters(localFilters, localSort)
    onOpenChange(false)
  }

  const handleReset = () => {
    const resetFilters: Filters = {
      genres: [],
      decade: '',
      language: '',
      availableOnly: false
    }
    const resetSort: Sort = {
      by: 'random',
      order: 'desc'
    }
    setLocalFilters(resetFilters)
    setLocalSort(resetSort)
    debouncedPreview(resetFilters)
    onResetFilters()
    onOpenChange(false)
  }

  // Fonction pour charger les langues disponibles
  const fetchAvailableLanguages = useCallback(async () => {
    try {
      const response = await fetch('/api/movies/languages')
      if (response.ok) {
        const data = await response.json()
        setAvailableLanguages(data.languages || [])
      }
    } catch (error) {
      console.error('Error fetching available languages:', error)
    }
  }, [])

  // Charger la prévisualisation initiale et les langues à l'ouverture de la modal
  useEffect(() => {
    if (open) {
      debouncedPreview(localFilters)
      fetchAvailableLanguages()
    }
  }, [open, debouncedPreview, localFilters, fetchAvailableLanguages])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Filtres et Tri</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section Filtres */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ListFilter className="h-4 w-4" />
              Filtres
            </h3>

            {/* Genres - Dropdown multiselect */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Genres</Label>
              <div className="relative">
                <Select
                  value=""
                  onValueChange={(value) => handleGenreToggle(value)}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Sélectionner des genres" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {AVAILABLE_GENRES.map(genre => (
                      <SelectItem key={genre} value={genre} className="text-white hover:bg-zinc-700">
                        <div className="flex items-center gap-2">
                          {localFilters.genres.includes(genre) && (
                            <Check className="h-4 w-4 text-orange-500" />
                          )}
                          {genre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Genres sélectionnés */}
                {localFilters.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {localFilters.genres.map(genre => (
                      <Badge
                        key={genre}
                        variant="secondary"
                        className="bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                        onClick={() => handleGenreToggle(genre)}
                      >
                        {genre}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Décennie */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Décennie</Label>
              <Select
                value={localFilters.decade || "all"}
                onValueChange={(value) => {
                  const newFilters = { ...localFilters, decade: value === "all" ? "" : value }
                  setLocalFilters(newFilters)
                  debouncedPreview(newFilters)
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Sélectionner une décennie" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all" className="text-white hover:bg-zinc-700">Toutes les décennies</SelectItem>
                  {DECADES.map(decade => (
                    <SelectItem key={decade.value} value={decade.value} className="text-white hover:bg-zinc-700">
                      {decade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Langue */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Langue</Label>
              <Select
                value={localFilters.language || "all"}
                onValueChange={(value) => {
                  const newFilters = { ...localFilters, language: value === "all" ? "" : value }
                  setLocalFilters(newFilters)
                  debouncedPreview(newFilters)
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all" className="text-white hover:bg-zinc-700">Toutes les langues</SelectItem>
                  {availableLanguages.map(langCode => (
                    <SelectItem key={langCode} value={langCode} className="text-white hover:bg-zinc-700">
                      {getLanguageName(langCode)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Disponibilité */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Disponibilité</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="availableOnly"
                  checked={localFilters.availableOnly}
                  onChange={(e) => {
                    const newFilters = { ...localFilters, availableOnly: e.target.checked }
                    setLocalFilters(newFilters)
                    debouncedPreview(newFilters)
                  }}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-orange-600 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                />
                <Label htmlFor="availableOnly" className="text-sm font-normal cursor-pointer">
                  Films disponibles uniquement
                </Label>
              </div>
            </div>
          </div>

          {/* Section Tri */}
          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Tri
            </h3>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Trier par</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={localSort.by}
                  onValueChange={(value) => setLocalSort(prev => ({ ...prev, by: value as Sort['by'] }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-white hover:bg-zinc-700">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Icône d'ordre interactive à droite */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-white hover:bg-zinc-800 h-10 w-10 flex-shrink-0"
                  onClick={() => {
                    const newSort = { ...localSort, order: localSort.order === 'asc' ? 'desc' : 'asc' as Sort['order'] }
                    setLocalSort(newSort)
                    // Pas de preview car le tri n'affecte pas le nombre de résultats
                  }}
                  title={localSort.order === 'asc' ? 'Croissant (A→Z)' : 'Décroissant (Z→A)'}
                >
                  {localSort.order === 'asc' ? (
                    <SortDescIcon key="asc" size={26} />
                  ) : (
                    <SortAscIcon key="desc" size={26} />
                  )}
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Ligne horizontale */}
        <div className="border-t border-zinc-800"></div>

        <DialogFooter className="flex items-center justify-between">
          {/* Compteur de résultats */}
          <div className="text-sm text-zinc-400">
            {previewLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Comptage...</span>
              </div>
            ) : (
              previewCount !== null && (
                <span className="text-orange-500">
                  {previewCount} résultat{previewCount !== 1 ? 's' : ''}
                </span>
              )
            )}
          </div>

          {/* Boutons */}
          <div className="flex gap-2 ml-5">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Réinitialiser
            </Button>
            <Button
              onClick={handleApply}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Appliquer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}