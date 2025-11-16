'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { AdminDepositCard } from '@/components/admin/admin-deposit-card'
import { Package, Loader2, AlertCircle } from 'lucide-react'
import type { AdminPendingDeposit } from '@/types/deposit'

export default function AdminDepositsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [deposits, setDeposits] = useState<AdminPendingDeposit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDeposits()
  }, [])

  const loadDeposits = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/deposits/pending')
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/')
          return
        }
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      setDeposits(data.deposits || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-zinc-400">Vous devez être connecté</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">Gestion des Dépôts</h1>
          </div>
          <p className="text-zinc-400">
            Gérez les dépôts de films en attente de traitement
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Chargement des dépôts...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-950/20 border border-red-800/30 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold mb-1">Erreur</p>
              <p className="text-red-400/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && deposits.length === 0 && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <Package className="w-20 h-20 text-zinc-600 mx-auto mb-4" />
              </div>
              <h2 className="text-zinc-300 text-xl mb-3 font-semibold">
                Aucun dépôt en attente
              </h2>
              <p className="text-zinc-500">
                Tous les dépôts ont été traités. De nouveaux dépôts apparaîtront
                ici lorsque les utilisateurs en créeront.
              </p>
            </div>
          </div>
        )}

        {/* Deposits List */}
        {!loading && !error && deposits.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-zinc-400">
                {deposits.length} dépôt{deposits.length > 1 ? 's' : ''} en attente
              </p>
              <button
                onClick={loadDeposits}
                className="text-sm text-orange-500 hover:text-orange-400"
              >
                Actualiser
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {deposits.map((deposit) => (
                <AdminDepositCard
                  key={deposit.deposit_id}
                  deposit={deposit}
                  onUpdate={loadDeposits}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
