'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search, Pencil, Trash2, Loader2, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { EditFilmDialog } from './edit-film-dialog'
import { DeleteFilmDialog } from './delete-film-dialog'

interface Movie {
  id: string
  tmdb_id: number
  titre_francais: string
  titre_original: string
  slug: string
  annee_sortie: number
  duree: number
  genres: string[]
  lien_vimeo: string | null
  poster_local_path: string | null
  statut: string
  copies_count: number
  synopsis: string | null
}

export function FilmsCatalogueTable() {
  const [films, setFilms] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showOnlyProcessing, setShowOnlyProcessing] = useState(false)
  const [selectedFilm, setSelectedFilm] = useState<Movie | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const isFirstRender = useRef(true)

  // Debounce de la recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch films avec paramètres de recherche serveur-side
  const fetchFilms = useCallback(async (search: string, processingOnly: boolean) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (processingOnly) params.set('showProcessingOnly', 'true')

      const url = `/api/admin/films/catalogue${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch films')
      const data = await res.json()
      setFilms(data.films)
    } catch (error) {
      console.error('Error fetching films:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch initial et à chaque changement de filtres
  useEffect(() => {
    // Skip first render pour éviter double fetch
    if (isFirstRender.current) {
      isFirstRender.current = false
      fetchFilms('', false)
      return
    }
    fetchFilms(debouncedSearch, showOnlyProcessing)
  }, [debouncedSearch, showOnlyProcessing, fetchFilms])

  const handleEdit = (film: Movie) => {
    setSelectedFilm(film)
    setEditDialogOpen(true)
  }

  const handleDelete = (film: Movie) => {
    setSelectedFilm(film)
    setDeleteDialogOpen(true)
  }

  const handleFilmUpdated = () => {
    fetchFilms(debouncedSearch, showOnlyProcessing)
    setEditDialogOpen(false)
    setSelectedFilm(null)
  }

  const handleFilmDeleted = () => {
    fetchFilms(debouncedSearch, showOnlyProcessing)
    setDeleteDialogOpen(false)
    setSelectedFilm(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full bg-zinc-800" />
        <Skeleton className="h-[600px] w-full bg-zinc-800" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search bar et filtres */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher par titre, acteur, réalisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
        <Button
          variant={showOnlyProcessing ? 'default' : 'outline'}
          onClick={() => setShowOnlyProcessing(!showOnlyProcessing)}
          className={showOnlyProcessing ? 'bg-orange-600 hover:bg-orange-700' : 'border-zinc-800 hover:bg-zinc-800'}
        >
          <Filter className="h-4 w-4 mr-2" />
          En traitement
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-zinc-400">
        {films.length} film(s) trouvé(s)
        {debouncedSearch && ` pour "${debouncedSearch}"`}
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
              <TableHead className="text-zinc-400 w-[80px]">Poster</TableHead>
              <TableHead className="text-zinc-400">Titre</TableHead>
              <TableHead className="text-zinc-400 w-[100px]">Année</TableHead>
              <TableHead className="text-zinc-400 w-[100px]">Durée</TableHead>
              <TableHead className="text-zinc-400">Genres</TableHead>
              <TableHead className="text-zinc-400 w-[100px]">TMDB ID</TableHead>
              <TableHead className="text-zinc-400 w-[120px]">Statut</TableHead>
              <TableHead className="text-zinc-400 w-[100px]">Copies</TableHead>
              <TableHead className="text-zinc-400 w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {films.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-zinc-500 py-8">
                  {debouncedSearch ? `Aucun film trouvé pour "${debouncedSearch}"` : 'Aucun film trouvé'}
                </TableCell>
              </TableRow>
            ) : (
              films.map((film) => (
                <TableRow
                  key={film.id}
                  className="border-zinc-800 hover:bg-zinc-900/50"
                >
                  <TableCell>
                    {film.poster_local_path ? (
                      <Image
                        src={film.poster_local_path}
                        alt={film.titre_francais}
                        width={50}
                        height={75}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-[50px] h-[75px] bg-zinc-800 rounded flex items-center justify-center">
                        <span className="text-xs text-zinc-600">N/A</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-white">{film.titre_francais}</div>
                      <div className="text-sm text-zinc-500">{film.titre_original}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">{film.annee_sortie}</TableCell>
                  <TableCell className="text-white">{film.duree} min</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {film.genres?.slice(0, 2).map((genre, i) => (
                        <Badge key={i} variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                          {genre}
                        </Badge>
                      ))}
                      {film.genres?.length > 2 && (
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                          +{film.genres.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-400">{film.tmdb_id}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        !film.lien_vimeo
                          ? 'bg-orange-600/20 text-orange-400 border-orange-600/30'
                          : film.statut === 'en ligne'
                          ? 'bg-green-600/20 text-green-400 border-green-600/30'
                          : 'bg-red-600/20 text-red-400 border-red-600/30'
                      }
                    >
                      {!film.lien_vimeo ? 'En traitement' : film.statut === 'en ligne' ? 'En ligne' : 'En traitement'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-zinc-700 text-white">
                      {film.copies_count}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                        >
                          <span className="sr-only">Ouvrir menu</span>
                          <span className="text-lg">⋮</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                        <DropdownMenuItem
                          onClick={() => handleEdit(film)}
                          className="text-white hover:bg-zinc-800 cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Éditer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(film)}
                          className="text-red-400 hover:bg-zinc-800 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <EditFilmDialog
        film={selectedFilm}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onFilmUpdated={handleFilmUpdated}
      />

      <DeleteFilmDialog
        film={selectedFilm}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onFilmDeleted={handleFilmDeleted}
      />
    </div>
  )
}
