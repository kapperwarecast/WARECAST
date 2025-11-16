"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Check,
  X,
  Package,
  Loader2,
  User,
  Calendar,
  Film,
  Disc,
  Disc3,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import type { AdminPendingDeposit, SupportType } from "@/types/deposit"
import { DEPOSIT_STATUS_LABELS, DEPOSIT_STATUS_COLORS } from "@/types/deposit"

interface AdminDepositCardProps {
  deposit: AdminPendingDeposit
  onUpdate?: () => void
}

function getSupportIcon(supportType: SupportType) {
  return supportType === "Blu-ray" ? <Disc3 className="w-3 h-3" /> : <Disc className="w-3 h-3" />
}

export function AdminDepositCard({ deposit, onUpdate }: AdminDepositCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'receive' | 'reject' | 'complete' | null>(null)

  // Form states
  const [rejectionReason, setRejectionReason] = useState("")
  const [movieId, setMovieId] = useState("")

  const handleReceive = async () => {
    setLoading(true)
    setAction('receive')

    try {
      const response = await fetch(`/api/admin/deposits/${deposit.deposit_id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du marquage')
      }

      onUpdate?.()
    } catch (error) {
      console.error('Error receiving deposit:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors du marquage')
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Veuillez saisir une raison de rejet')
      return
    }

    if (!confirm('Confirmer le rejet de ce dépôt ?')) {
      return
    }

    setLoading(true)
    setAction('reject')

    try {
      const response = await fetch(`/api/admin/deposits/${deposit.deposit_id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du rejet')
      }

      onUpdate?.()
    } catch (error) {
      console.error('Error rejecting deposit:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors du rejet')
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const handleComplete = async () => {
    if (!movieId.trim()) {
      alert('Veuillez saisir l\'ID du film')
      return
    }

    if (!confirm('Confirmer la finalisation de ce dépôt ?')) {
      return
    }

    setLoading(true)
    setAction('complete')

    try {
      const response = await fetch(`/api/admin/deposits/${deposit.deposit_id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la finalisation')
      }

      onUpdate?.()
    } catch (error) {
      console.error('Error completing deposit:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la finalisation')
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const statusColor = DEPOSIT_STATUS_COLORS[deposit.status]

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <div className="space-y-4">
        {/* Header - Always Visible */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-white text-lg">{deposit.film_title}</h3>
              <Badge variant="secondary" className="bg-blue-950/30 text-blue-400 border-blue-800/30 text-xs">
                {getSupportIcon(deposit.support_type)}
                <span className="ml-1">{deposit.support_type}</span>
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{deposit.user_email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(deposit.sent_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="font-mono text-xs bg-black/40 px-2 py-1 rounded">
                {deposit.tracking_number}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={statusColor}>
              {DEPOSIT_STATUS_LABELS[deposit.status]}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-zinc-400"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded Section */}
        {expanded && (
          <div className="pt-4 border-t border-zinc-800 space-y-4">
            {/* Additional Notes */}
            {deposit.additional_notes && (
              <div className="bg-black/40 rounded-lg p-3">
                <p className="text-sm text-zinc-400">
                  <strong className="text-white">Notes:</strong> {deposit.additional_notes}
                </p>
              </div>
            )}

            {/* Actions based on status */}
            {deposit.status === 'sent' && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">Marquer comme réceptionné ou rejeter ce dépôt</p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleReceive}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loading && action === 'receive' ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
                    ) : (
                      <><Check className="w-4 h-4 mr-2" /> Marquer comme reçu</>
                    )}
                  </Button>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <Label className="text-white mb-2 block">Raison du rejet</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ex: Support défectueux, contenu non conforme..."
                    className="bg-black border-zinc-700 text-white mb-3"
                    rows={2}
                  />
                  <Button
                    onClick={handleReject}
                    disabled={loading || !rejectionReason.trim()}
                    variant="outline"
                    className="w-full border-red-800 text-red-400 hover:bg-red-950/30"
                  >
                    {loading && action === 'reject' ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rejet...</>
                    ) : (
                      <><X className="w-4 h-4 mr-2" /> Rejeter le dépôt</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {deposit.status === 'received' && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <Label className="text-white mb-2 block">ID du film (UUID)</Label>
                <Input
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  placeholder="Ex: 550e8400-e29b-41d4-a716-446655440000"
                  className="bg-black border-zinc-700 text-white mb-3"
                />
                <p className="text-xs text-zinc-500 mb-3">
                  Saisissez l&apos;UUID du film dans la base de données pour finaliser le dépôt
                  et créer l&apos;entrée dans le registre de propriété.
                </p>
                <Button
                  onClick={handleComplete}
                  disabled={loading || !movieId.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {loading && action === 'complete' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalisation...</>
                  ) : (
                    <><Film className="w-4 h-4 mr-2" /> Finaliser et ajouter au registre</>
                  )}
                </Button>
              </div>
            )}

            {deposit.status === 'digitizing' && (
              <div className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-4">
                <p className="text-sm text-purple-400">
                  Numérisation en cours... Complétez lorsque le film est prêt.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
