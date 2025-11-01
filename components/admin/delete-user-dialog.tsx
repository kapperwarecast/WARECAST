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
import type { AdminUser } from './users-table'

interface DeleteUserDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onDeleted,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!user) return

    try {
      setIsDeleting(true)
      setError(null)

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      // Success
      onDeleted()
      onOpenChange(false)
    } catch (err) {
      console.error('[DeleteUserDialog] Error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!user) return null

  const userName = user.prenom && user.nom
    ? `${user.prenom} ${user.nom}`
    : user.username || user.email || 'Cet utilisateur'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Supprimer l'utilisateur ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Êtes-vous sûr de vouloir supprimer <strong className="text-white">{userName}</strong> ?
            <br />
            <br />
            Cette action est <strong className="text-red-400">irréversible</strong> et supprimera :
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Le profil utilisateur</li>
              <li>L'historique des emprunts</li>
              <li>L'historique des paiements</li>
              <li>Les favoris</li>
            </ul>
          </AlertDialogDescription>
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
