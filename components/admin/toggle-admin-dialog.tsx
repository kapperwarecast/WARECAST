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

interface ToggleAdminDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggled: () => void
}

export function ToggleAdminDialog({
  user,
  open,
  onOpenChange,
  onToggled,
}: ToggleAdminDialogProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async () => {
    if (!user) return

    try {
      setIsToggling(true)
      setError(null)

      const res = await fetch(`/api/admin/users/${user.id}/toggle-admin`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la modification')
      }

      // Success
      onToggled()
      onOpenChange(false)
    } catch (err) {
      console.error('[ToggleAdminDialog] Error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsToggling(false)
    }
  }

  if (!user) return null

  const userName = user.prenom && user.nom
    ? `${user.prenom} ${user.nom}`
    : user.username || user.email || 'Cet utilisateur'

  const isPromoting = !user.is_admin

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {isPromoting ? 'Promouvoir administrateur' : 'Retirer les droits admin'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {isPromoting ? (
              <>
                Êtes-vous sûr de vouloir donner les droits administrateur à <strong className="text-white">{userName}</strong> ?
                <br />
                <br />
                Cette personne aura accès à :
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>La gestion des films et imports</li>
                  <li>La gestion des utilisateurs</li>
                  <li>Toutes les fonctionnalités d&apos;administration</li>
                </ul>
              </>
            ) : (
              <>
                Êtes-vous sûr de vouloir retirer les droits administrateur à <strong className="text-white">{userName}</strong> ?
                <br />
                <br />
                Cette personne perdra l&apos;accès à :
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>La gestion des films et imports</li>
                  <li>La gestion des utilisateurs</li>
                  <li>Toutes les fonctionnalités d&apos;administration</li>
                </ul>
              </>
            )}
          </AlertDialogDescription>
          {error && (
            <p className="text-sm text-red-400 mt-2">{error}</p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isToggling}
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggle}
            disabled={isToggling}
            className={isPromoting ? 'bg-purple-600 hover:bg-purple-700' : 'bg-zinc-600 hover:bg-zinc-700'}
          >
            {isToggling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Modification...
              </>
            ) : (
              isPromoting ? 'Promouvoir admin' : 'Retirer admin'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
