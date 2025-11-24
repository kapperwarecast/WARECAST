'use client'

import { useState } from 'react'
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
import { Loader2 } from 'lucide-react'

interface Movie {
  id: string
  titre_francais: string
  copies_count: number
}

interface DeleteFilmDialogProps {
  film: Movie | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilmDeleted: () => void
}

export function DeleteFilmDialog({
  film,
  open,
  onOpenChange,
  onFilmDeleted,
}: DeleteFilmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!film) return

    try {
      setIsDeleting(true)
      setError(null)

      const res = await fetch(`/api/admin/films/${film.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      // Success
      onFilmDeleted()
      onOpenChange(false)
    } catch (err) {
      console.error('[DeleteFilmDialog] Error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!film) return null

  const hasCopies = film.copies_count > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Supprimer le film ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Êtes-vous sûr de vouloir supprimer{' '}
            <strong className="text-white">{film.titre_francais}</strong> ?
          </AlertDialogDescription>

          {hasCopies ? (
            <div className="mt-4 rounded-lg bg-red-600/20 border border-red-600/30 p-4">
              <p className="text-sm text-red-400 font-medium">
                ⚠️ Impossible de supprimer ce film
              </p>
              <p className="text-sm text-red-400 mt-2">
                Il existe encore <strong>{film.copies_count}</strong> copie(s) physique(s) de ce
                film dans le registre. Vous devez d&apos;abord supprimer toutes les copies avant de
                pouvoir supprimer le film du catalogue.
              </p>
            </div>
          ) : (
            <div className="mt-4 text-sm text-zinc-400 space-y-2">
              <p>
                Cette action est <strong className="text-red-400">irréversible</strong> et :
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Supprimera définitivement le film du catalogue</li>
                <li>Les métadonnées (titre, synopsis, poster) seront perdues</li>
                <li>Cette action ne peut pas être annulée</li>
              </ul>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 mt-2">{error}</p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            Annuler
          </AlertDialogCancel>
          {!hasCopies && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer définitivement'
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
