'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { Search, History, Loader2, Plus, Trash2 } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FilmHistoryDialog } from './film-history-dialog'
import { PendingDepositsTable } from './pending-deposits-table'
import { CreatePhysicalCopyDialog } from './create-physical-copy-dialog'

interface RegistryEntry {
  id: string
  movie_id: string
  current_owner_id: string
  physical_support_type: string
  acquisition_method: string
  acquisition_date: string
  is_available: boolean
  owner_email: string | null
  movie: {
    id: string
    titre_francais: string
    titre_original: string
    poster_local_path: string | null
    annee_sortie: number
  }
  owner: {
    id: string
    prenom: string
    nom: string
    username: string | null
  }
}

type PendingDeposit = {
  deposit_id: string
  tracking_number: string
  user_name: string
  film_title: string
  support_type: string
  status: string
  sent_at: string
  user_email: string
  notes: string | null
  [key: string]: unknown
}
type Movie = { id: string; titre_francais: string; titre_original?: string; annee_sortie: number; [key: string]: unknown }

export function FilmsRegistryTable() {
  const [registry, setRegistry] = useState<RegistryEntry[]>([])
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegistryId, setSelectedRegistryId] = useState<string | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<RegistryEntry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchRegistry = useCallback(async () => {
    try {
      setLoading(true)

      // Récupérer registry + pending deposits
      const res = await fetch('/api/admin/films/registry')
      if (!res.ok) throw new Error('Failed to fetch registry')
      const data = await res.json()
      setRegistry(data.registry)
      setPendingDeposits(data.pendingDeposits || [])

      // Récupérer la liste des films pour le dialog
      const moviesRes = await fetch('/api/admin/films/catalogue')
      if (moviesRes.ok) {
        const moviesData = await moviesRes.json()
        setMovies(moviesData.films || [])
      }
    } catch (error) {
      console.error('Error fetching registry:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRegistry()
  }, [fetchRegistry])

  // Récupérer l'ID de l'utilisateur connecté
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/user')
        if (res.ok) {
          const data = await res.json()
          setCurrentUserId(data.user?.id || '')
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }
    fetchCurrentUser()
  }, [])

  const filteredRegistry = useMemo(() => {
    if (!searchQuery) return registry

    const query = searchQuery.toLowerCase()
    return registry.filter(
      entry =>
        entry.movie?.titre_francais?.toLowerCase().includes(query) ||
        entry.movie?.titre_original?.toLowerCase().includes(query) ||
        entry.owner?.prenom?.toLowerCase().includes(query) ||
        entry.owner?.nom?.toLowerCase().includes(query) ||
        entry.owner_email?.toLowerCase().includes(query)
    )
  }, [registry, searchQuery])

  const handleViewHistory = (registryId: string) => {
    setSelectedRegistryId(registryId)
    setHistoryDialogOpen(true)
  }

  const handleDeleteClick = (entry: RegistryEntry) => {
    setEntryToDelete(entry)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/films/registry/${entryToDelete.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la suppression')
        return
      }

      // Rafraîchir la liste
      await fetchRegistry()
    } catch (error) {
      console.error('Error deleting registry entry:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
    }
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
    <div className="space-y-6">
      {/* Header avec bouton création */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher par titre ou propriétaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer une copie physique
        </Button>
      </div>

      {/* Dépôts en attente */}
      {pendingDeposits.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            Dépôts en attente ({pendingDeposits.length})
          </h2>
          <PendingDepositsTable
            deposits={pendingDeposits}
            onRefresh={fetchRegistry}
            movies={movies}
          />
        </div>
      )}

      {/* Registre principal */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">
          Registre de propriété ({filteredRegistry.length})
        </h2>

        {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
              <TableHead className="text-zinc-400 w-[300px]">Film</TableHead>
              <TableHead className="text-zinc-400 w-[100px]">Support</TableHead>
              <TableHead className="text-zinc-400">Propriétaire actuel</TableHead>
              <TableHead className="text-zinc-400 w-[150px]">Acquisition</TableHead>
              <TableHead className="text-zinc-400 w-[120px]">Date</TableHead>
              <TableHead className="text-zinc-400 w-[120px]">Disponibilité</TableHead>
              <TableHead className="text-zinc-400 w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistry.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-500 py-8">
                  Aucune copie trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredRegistry.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="border-zinc-800 hover:bg-zinc-900/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {entry.movie?.poster_local_path ? (
                        <Image
                          src={entry.movie.poster_local_path}
                          alt={entry.movie.titre_francais}
                          width={40}
                          height={60}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-[40px] h-[60px] bg-zinc-800 rounded flex items-center justify-center">
                          <span className="text-xs text-zinc-600">N/A</span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="font-medium text-white text-sm">
                          {entry.movie?.titre_francais || 'Titre inconnu'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {entry.movie?.annee_sortie}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        entry.physical_support_type === 'Blu-ray'
                          ? 'bg-blue-600/20 text-blue-400 border-blue-600/30'
                          : entry.physical_support_type === '4k'
                          ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                          : 'bg-purple-600/20 text-purple-400 border-purple-600/30'
                      }
                    >
                      {entry.physical_support_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-white text-sm">
                        {entry.owner?.prenom} {entry.owner?.nom}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {entry.owner_email || 'Email non disponible'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-300 text-xs"
                    >
                      {entry.acquisition_method === 'deposit'
                        ? 'Dépôt'
                        : entry.acquisition_method === 'exchange'
                        ? 'Échange'
                        : entry.acquisition_method === 'sponsorship'
                        ? 'Parrainage'
                        : 'Redistribution'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {new Date(entry.acquisition_date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        entry.is_available
                          ? 'bg-green-600/20 text-green-400 border-green-600/30'
                          : 'bg-red-600/20 text-red-400 border-red-600/30'
                      }
                    >
                      {entry.is_available ? 'Disponible' : 'En session'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewHistory(entry.id)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(entry)}
                        className="text-zinc-400 hover:text-red-500"
                        disabled={!entry.is_available}
                        title={!entry.is_available ? 'Session en cours - suppression impossible' : 'Supprimer'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      </div>

      {/* Dialogs */}
      <FilmHistoryDialog
        registryId={selectedRegistryId}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />

      <CreatePhysicalCopyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCopyCreated={fetchRegistry}
        currentUserId={currentUserId}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Supprimer cette copie ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {entryToDelete && (
                <>
                  Vous allez supprimer la copie de{' '}
                  <span className="font-semibold text-white">
                    {entryToDelete.movie?.titre_francais || 'Film inconnu'}
                  </span>{' '}
                  ({entryToDelete.physical_support_type}) appartenant à{' '}
                  <span className="font-semibold text-white">
                    {entryToDelete.owner?.prenom} {entryToDelete.owner?.nom}
                  </span>
                  .
                  <br /><br />
                  Cette action est irréversible et supprimera également tout l&apos;historique de propriété associé.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
              disabled={isDeleting}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
