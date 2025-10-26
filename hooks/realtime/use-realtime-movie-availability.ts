'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSubscription } from './use-realtime-subscription'
import type { UseRealtimeMovieAvailabilityReturn } from '@/types'

/**
 * Hook pour s'abonner aux changements de disponibilité d'un film en temps réel
 * Détecte instantanément :
 * - Les changements de copies_disponibles sur la table movies
 * - Les nouveaux emprunts (autres utilisateurs qui louent le film)
 * - Les retours (autres utilisateurs qui rendent le film)
 */
export function useRealtimeMovieAvailability(
  movieId: string,
  initialCopies?: number
): UseRealtimeMovieAvailabilityReturn {
  const [copiesDisponibles, setCopiesDisponibles] = useState<number | null>(
    initialCopies ?? null
  )
  const [totalRentals, setTotalRentals] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Fonction pour vérifier l'état initial
  const checkInitialState = async () => {
    if (!movieId) {
      setCopiesDisponibles(null)
      setTotalRentals(null)
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Récupérer les copies disponibles
    const { data: movieData, error: movieError } = await supabase
      .from('movies')
      .select('copies_disponibles')
      .eq('id', movieId)
      .single()

    if (!movieError && movieData) {
      setCopiesDisponibles(movieData.copies_disponibles)
      console.log(`📡 [Realtime Availability] État initial: Film ${movieId} a ${movieData.copies_disponibles} copies disponibles`)
    }

    // Compter les emprunts actifs
    const { count, error: countError } = await supabase
      .from('emprunts')
      .select('*', { count: 'exact', head: true })
      .eq('movie_id', movieId)
      .eq('statut', 'en_cours')

    if (!countError) {
      setTotalRentals(count || 0)
      console.log(`📡 [Realtime Availability] État initial: Film ${movieId} a ${count} emprunts actifs`)
    }

    setLoading(false)
  }

  // Channel 1: Écouter les changements sur la table movies
  useRealtimeSubscription({
    channelName: `movie-availability-${movieId}`,
    enabled: !!movieId,
    initialStateFetcher: checkInitialState,
    listeners: [
      {
        config: {
          event: 'UPDATE',
          schema: 'public',
          table: 'movies',
          filter: `id=eq.${movieId}`,
        },
        handler: (payload) => {
          console.log(`📡 [Realtime Availability] UPDATE détecté sur movie ${movieId}`)
          if (payload.new && typeof payload.new.copies_disponibles === 'number') {
            setCopiesDisponibles(payload.new.copies_disponibles)
          }
        },
      },
    ],
  })

  // Channel 2: Écouter les changements sur la table emprunts
  useRealtimeSubscription({
    channelName: `movie-rentals-${movieId}`,
    enabled: !!movieId,
    listeners: [
      {
        config: {
          event: 'INSERT',
          schema: 'public',
          table: 'emprunts',
          filter: `movie_id=eq.${movieId}`,
        },
        handler: (payload) => {
          if (payload.new.statut === 'en_cours') {
            console.log(`📡 [Realtime Availability] Nouvel emprunt détecté pour film ${movieId}`)
            setTotalRentals((prev) => (prev !== null ? prev + 1 : 1))
            checkInitialState()
          }
        },
      },
      {
        config: {
          event: 'UPDATE',
          schema: 'public',
          table: 'emprunts',
          filter: `movie_id=eq.${movieId}`,
        },
        handler: (payload) => {
          const oldRecord = payload.old as { statut?: string }
          const newRecord = payload.new as { statut?: string }
          if (oldRecord.statut === 'en_cours' && newRecord.statut !== 'en_cours') {
            console.log(`📡 [Realtime Availability] Film ${movieId} rendu par un utilisateur`)
            setTotalRentals((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
            checkInitialState()
          }
        },
      },
      {
        config: {
          event: 'DELETE',
          schema: 'public',
          table: 'emprunts',
          filter: `movie_id=eq.${movieId}`,
        },
        handler: (payload) => {
          const oldRecord = payload.old as { statut?: string }
          if (oldRecord.statut === 'en_cours') {
            console.log(`📡 [Realtime Availability] Emprunt supprimé pour film ${movieId}`)
            setTotalRentals((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
            checkInitialState()
          }
        },
      },
    ],
  })

  return {
    copiesDisponibles,
    totalRentals,
    loading,
  }
}
