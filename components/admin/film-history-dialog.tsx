'use client'

import { useState, useEffect } from 'react'
import { Loader2, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Transfer {
  id: string
  registry_id: string
  from_user_id: string | null
  to_user_id: string
  transfer_type: string
  transfer_date: string
  from_user: {
    id: string
    prenom: string
    nom: string
    username: string | null
  } | null
  to_user: {
    id: string
    prenom: string
    nom: string
    username: string | null
  }
  from_email: string | null
  to_email: string | null
}

interface FilmHistoryDialogProps {
  registryId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FilmHistoryDialog({
  registryId,
  open,
  onOpenChange,
}: FilmHistoryDialogProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !registryId) {
      setTransfers([])
      setError(null)
      return
    }

    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/admin/films/${registryId}/history`)
        if (!res.ok) {
          throw new Error('Erreur lors du chargement de l\'historique')
        }

        const data = await res.json()
        setTransfers(data.history)
      } catch (err) {
        console.error('[FilmHistoryDialog] Error:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [open, registryId])

  const getTransferTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Dépôt initial'
      case 'exchange':
        return 'Échange'
      case 'sponsorship':
        return 'Parrainage'
      case 'redistribution':
        return 'Redistribution'
      default:
        return type
    }
  }

  const getTransferTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30'
      case 'exchange':
        return 'bg-purple-600/20 text-purple-400 border-purple-600/30'
      case 'sponsorship':
        return 'bg-green-600/20 text-green-400 border-green-600/30'
      case 'redistribution':
        return 'bg-orange-600/20 text-orange-400 border-orange-600/30'
      default:
        return 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Historique de propriété</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Historique complet des transferts de cette copie physique
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full bg-zinc-800" />
            <Skeleton className="h-20 w-full bg-zinc-800" />
            <Skeleton className="h-20 w-full bg-zinc-800" />
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-zinc-500">Aucun historique disponible</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {transfers.map((transfer, index) => (
              <div
                key={transfer.id}
                className="relative border border-zinc-800 rounded-lg p-4 bg-zinc-900/50"
              >
                {/* Timeline connector */}
                {index < transfers.length - 1 && (
                  <div className="absolute left-8 top-[100%] h-4 w-0.5 bg-zinc-800" />
                )}

                {/* Transfer header */}
                <div className="flex items-center justify-between mb-3">
                  <Badge className={getTransferTypeBadgeClass(transfer.transfer_type)}>
                    {getTransferTypeLabel(transfer.transfer_type)}
                  </Badge>
                  <span className="text-xs text-zinc-500">
                    {new Date(transfer.transfer_date).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Transfer details */}
                <div className="flex items-center gap-3">
                  {/* From user */}
                  {transfer.from_user ? (
                    <div className="flex-1 text-sm">
                      <div className="font-medium text-white">
                        {transfer.from_user.prenom} {transfer.from_user.nom}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {transfer.from_email || 'Email non disponible'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 text-sm">
                      <div className="font-medium text-zinc-500 italic">Système</div>
                      <div className="text-xs text-zinc-600">Ajout initial</div>
                    </div>
                  )}

                  {/* Arrow */}
                  <ArrowRight className="h-5 w-5 text-zinc-600 flex-shrink-0" />

                  {/* To user */}
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-white">
                      {transfer.to_user.prenom} {transfer.to_user.nom}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {transfer.to_email || 'Email non disponible'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
