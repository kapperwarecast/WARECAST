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

interface CancelSubscriptionDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancelled: () => void
}

export function CancelSubscriptionDialog({
  user,
  open,
  onOpenChange,
  onCancelled,
}: CancelSubscriptionDialogProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    if (!user) return

    try {
      setIsCancelling(true)
      setError(null)

      const res = await fetch(`/api/admin/users/${user.id}/cancel-subscription`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la résiliation')
      }

      // Success
      onCancelled()
      onOpenChange(false)
    } catch (err) {
      console.error('[CancelSubscriptionDialog] Error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsCancelling(false)
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
            Résilier l&apos;abonnement ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Êtes-vous sûr de vouloir résilier l&apos;abonnement de <strong className="text-white">{userName}</strong> ?
            <br />
            <br />
            Conséquences :
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>L&apos;abonnement sera marqué comme &quot;résilié&quot;</li>
              <li>L&apos;utilisateur pourra continuer à échanger jusqu&apos;à la date d&apos;expiration</li>
              <li>Aucun renouvellement automatique ne sera effectué</li>
              <li>L&apos;abonnement Stripe sera annulé</li>
            </ul>
          </AlertDialogDescription>
          {error && (
            <p className="text-sm text-red-400 mt-2">{error}</p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isCancelling}
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isCancelling}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Résiliation...
              </>
            ) : (
              'Résilier l\'abonnement'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
