'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface Movie {
  id: string
  titre_francais: string
  titre_original: string
  annee_sortie: number
}

interface User {
  id: string
  prenom: string
  nom: string
  email: string
}

interface CreatePhysicalCopyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCopyCreated: () => void
  currentUserId: string
}

export function CreatePhysicalCopyDialog({
  open,
  onOpenChange,
  onCopyCreated,
  currentUserId,
}: CreatePhysicalCopyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingMovies, setLoadingMovies] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    movieId: '',
    ownerId: currentUserId, // Par défaut: admin connecté
    physicalSupportType: 'Blu-ray',
    notes: '',
  })

  // Charger les films
  useEffect(() => {
    if (!open) return

    const fetchMovies = async () => {
      try {
        setLoadingMovies(true)
        const res = await fetch('/api/admin/films/catalogue')
        if (!res.ok) throw new Error('Erreur lors du chargement des films')
        const data = await res.json()
        setMovies(data.films || [])
      } catch (err) {
        console.error('[CreatePhysicalCopyDialog] Error loading movies:', err)
      } finally {
        setLoadingMovies(false)
      }
    }

    fetchMovies()
  }, [open])

  // Charger les utilisateurs
  useEffect(() => {
    if (!open) return

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)
        const res = await fetch('/api/admin/users')
        if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs')
        const data = await res.json()
        setUsers(data.users || [])
      } catch (err) {
        console.error('[CreatePhysicalCopyDialog] Error loading users:', err)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [open])

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (open) {
      setFormData({
        movieId: '',
        ownerId: currentUserId,
        physicalSupportType: 'Blu-ray',
        notes: '',
      })
      setSearchQuery('')
      setError(null)
    }
  }, [open, currentUserId])

  const filteredMovies = movies.filter(movie =>
    movie.titre_francais?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movie.titre_original?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.movieId || !formData.ownerId) {
      setError('Veuillez sélectionner un film et un propriétaire')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const res = await fetch('/api/admin/films/registry/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la création de la copie')
      }

      onCopyCreated()
      onOpenChange(false)
    } catch (err) {
      console.error('[CreatePhysicalCopyDialog] Error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Créer une copie physique</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Enregistrez une nouvelle copie physique directement dans le registre
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-3">
              {error}
            </div>
          )}

          {/* Film */}
          <div className="space-y-2">
            <Label htmlFor="search-movie" className="text-white">
              Film *
            </Label>
            <Input
              id="search-movie"
              placeholder="Rechercher un film..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white mb-2"
              disabled={loadingMovies}
            />
            <Select
              value={formData.movieId}
              onValueChange={(value) => setFormData({ ...formData, movieId: value })}
              disabled={loadingMovies}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder={loadingMovies ? "Chargement..." : "Sélectionner un film"} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 max-h-[300px]">
                {filteredMovies.slice(0, 50).map((movie) => (
                  <SelectItem key={movie.id} value={movie.id} className="text-white">
                    {movie.titre_francais} ({movie.annee_sortie})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-zinc-500 text-xs">
              {filteredMovies.length} film(s) trouvé(s)
              {filteredMovies.length > 50 && ' (50 premiers affichés)'}
            </p>
          </div>

          {/* Propriétaire */}
          <div className="space-y-2">
            <Label htmlFor="owner" className="text-white">
              Propriétaire *
            </Label>
            <Select
              value={formData.ownerId}
              onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
              disabled={loadingUsers}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder={loadingUsers ? "Chargement..." : "Sélectionner un propriétaire"} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 max-h-[300px]">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="text-white">
                    {user.prenom} {user.nom} {user.id === currentUserId && '(Moi-même)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type de support */}
          <div className="space-y-2">
            <Label htmlFor="support-type" className="text-white">
              Type de support *
            </Label>
            <Select
              value={formData.physicalSupportType}
              onValueChange={(value) => setFormData({ ...formData, physicalSupportType: value })}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="Blu-ray" className="text-white">
                  Blu-ray
                </SelectItem>
                <SelectItem value="DVD" className="text-white">
                  DVD
                </SelectItem>
                <SelectItem value="4k" className="text-white">
                  4K Ultra HD
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">
              Notes (optionnel)
            </Label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations complémentaires..."
              className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.movieId || !formData.ownerId}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la copie
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
