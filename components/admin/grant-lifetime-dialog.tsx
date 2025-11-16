"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crown, Loader2, AlertTriangle } from "lucide-react"
import type { AdminUser } from "@/components/admin/users-table"

interface GrantLifetimeDialogProps {
  isOpen: boolean
  onClose: () => void
  user: AdminUser | null
  onSuccess: () => void
}

export function GrantLifetimeDialog({
  isOpen,
  onClose,
  user,
  onSuccess,
}: GrantLifetimeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const hasActiveSubscription =
    user.subscription_status === "active" ||
    (user.subscription_status === "resigned" &&
      user.subscription_expires_at &&
      new Date(user.subscription_expires_at) > new Date())

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}/grant-lifetime-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'attribution de l'abonnement")
      }

      // Succès
      onSuccess()
      onClose()
    } catch (err) {
      console.error("Erreur grant lifetime:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-500" />
            Attribuer un abonnement à vie
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Cette action attribuera un abonnement permanent à l&apos;utilisateur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informations utilisateur */}
          <div className="bg-zinc-900 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Utilisateur :</span>
              <span className="text-sm font-medium text-white">
                {user.prenom && user.nom
                  ? `${user.prenom} ${user.nom}`
                  : user.username || user.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Email :</span>
              <span className="text-sm text-zinc-300">{user.email}</span>
            </div>
          </div>

          {/* Avertissement si abonnement Stripe actif */}
          {hasActiveSubscription && (
            <div className="bg-orange-950/30 border border-orange-800/30 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-400">
                  Attention : Abonnement actif détecté
                </p>
                <p className="text-xs text-orange-300/80">
                  L&apos;abonnement Stripe actuel sera annulé automatiquement. L&apos;utilisateur
                  ne sera plus facturé.
                </p>
              </div>
            </div>
          )}

          {/* Informations de l'abonnement à vie */}
          <div className="bg-purple-950/30 border border-purple-800/30 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-purple-400">
              Avantages de l&apos;abonnement à vie :
            </p>
            <ul className="text-xs text-purple-300/80 space-y-1 list-disc list-inside">
              <li>Échanges illimités et gratuits</li>
              <li>Aucune date d&apos;expiration</li>
              <li>Aucune facturation Stripe</li>
              <li>Visible dans l&apos;admin avec badge violet &ldquo;À vie&rdquo;</li>
            </ul>
          </div>

          {/* Erreur si présente */}
          {error && (
            <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-zinc-700"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Attribution en cours...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Confirmer l&apos;attribution
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
