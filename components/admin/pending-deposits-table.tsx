'use client'

import { useState } from 'react'
import { Loader2, Check, X, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Combobox } from '@/components/ui/combobox'

interface PendingDeposit {
  deposit_id: string
  tracking_number: string
  user_email: string
  user_name: string
  film_title: string
  support_type: string
  status: string
  sent_at: string
  notes: string | null
}

interface PendingDepositsTableProps {
  deposits: PendingDeposit[]
  onRefresh: () => void
  movies: Array<{ id: string; titre_francais: string; annee_sortie: number }>
}

export function PendingDepositsTable({ deposits, onRefresh, movies }: PendingDepositsTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedMovies, setSelectedMovies] = useState<Record<string, string>>({})
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">Envoyé</Badge>
      case 'received':
        return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">Reçu</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleMarkReceived = async (depositId: string) => {
    try {
      setProcessingId(depositId)
      setError(null)

      const res = await fetch(`/api/admin/deposits/${depositId}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la réception')
      }

      onRefresh()
    } catch (err) {
      console.error('[PendingDepositsTable] Error marking received:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setProcessingId(null)
    }
  }

  const handleComplete = async (depositId: string) => {
    const movieId = selectedMovies[depositId]

    if (!movieId) {
      setError('Veuillez sélectionner un film')
      return
    }

    try {
      setProcessingId(depositId)
      setError(null)

      const res = await fetch(`/api/admin/deposits/${depositId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la finalisation')
      }

      onRefresh()
    } catch (err) {
      console.error('[PendingDepositsTable] Error completing:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (depositId: string) => {
    const reason = rejectionReasons[depositId]

    if (!reason || reason.trim() === '') {
      setError('Veuillez indiquer une raison de rejet')
      return
    }

    try {
      setProcessingId(depositId)
      setError(null)

      const res = await fetch(`/api/admin/deposits/${depositId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors du rejet')
      }

      onRefresh()
      setRejectionReasons((prev) => {
        const updated = { ...prev }
        delete updated[depositId]
        return updated
      })
    } catch (err) {
      console.error('[PendingDepositsTable] Error rejecting:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setProcessingId(null)
    }
  }

  if (deposits.length === 0) {
    return (
      <div className="border border-zinc-800 rounded-lg p-8 text-center">
        <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400">Aucun dépôt en attente</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-3">
          {error}
        </div>
      )}

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
              <TableHead className="text-zinc-400 w-[150px]">Tracking</TableHead>
              <TableHead className="text-zinc-400">Utilisateur</TableHead>
              <TableHead className="text-zinc-400">Film demandé</TableHead>
              <TableHead className="text-zinc-400 w-[100px]">Support</TableHead>
              <TableHead className="text-zinc-400 w-[120px]">Date envoi</TableHead>
              <TableHead className="text-zinc-400 w-[100px]">Statut</TableHead>
              <TableHead className="text-zinc-400 w-[300px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.map((deposit) => (
              <TableRow key={deposit.deposit_id} className="border-zinc-800 hover:bg-zinc-900/50">
                <TableCell className="font-mono text-xs text-zinc-300">
                  {deposit.tracking_number}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-white text-sm">{deposit.user_name}</div>
                    <div className="text-xs text-zinc-500">{deposit.user_email}</div>
                  </div>
                </TableCell>
                <TableCell className="text-white text-sm">
                  {deposit.film_title}
                  {deposit.notes && (
                    <div className="text-xs text-zinc-500 mt-1">{deposit.notes}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      deposit.support_type === 'Blu-ray'
                        ? 'bg-blue-600/20 text-blue-400 border-blue-600/30'
                        : 'bg-purple-600/20 text-purple-400 border-purple-600/30'
                    }
                  >
                    {deposit.support_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">
                  {new Date(deposit.sent_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {deposit.status === 'sent' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleMarkReceived(deposit.deposit_id)}
                          disabled={processingId === deposit.deposit_id}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                        >
                          {processingId === deposit.deposit_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Reçu
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(deposit.deposit_id)}
                          disabled={processingId === deposit.deposit_id || !rejectionReasons[deposit.deposit_id]}
                          className="flex-1"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    )}

                    {deposit.status === 'sent' && (
                      <Input
                        placeholder="Raison du rejet..."
                        value={rejectionReasons[deposit.deposit_id] || ''}
                        onChange={(e) =>
                          setRejectionReasons((prev) => ({
                            ...prev,
                            [deposit.deposit_id]: e.target.value,
                          }))
                        }
                        className="bg-zinc-800 border-zinc-700 text-white text-xs"
                      />
                    )}

                    {deposit.status === 'received' && (
                      <div className="space-y-2">
                        <Combobox
                          value={selectedMovies[deposit.deposit_id] || ''}
                          onValueChange={(value) =>
                            setSelectedMovies((prev) => ({
                              ...prev,
                              [deposit.deposit_id]: value,
                            }))
                          }
                          options={movies.map((movie) => ({
                            value: movie.id,
                            label: `${movie.titre_francais} (${movie.annee_sortie})`,
                          }))}
                          placeholder="Sélectionner le film..."
                          searchPlaceholder="Rechercher un film..."
                          emptyText="Aucun film trouvé"
                          className="bg-zinc-800 border-zinc-700 text-white text-xs h-8"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleComplete(deposit.deposit_id)}
                          disabled={processingId === deposit.deposit_id || !selectedMovies[deposit.deposit_id]}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {processingId === deposit.deposit_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Finaliser'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
