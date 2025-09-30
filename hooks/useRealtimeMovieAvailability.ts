'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseRealtimeMovieAvailabilityReturn {
  copiesDisponibles: number | null
  loading: boolean
}

/**
 * Hook pour s'abonner aux mises à jour en temps réel du nombre de copies disponibles d'un film
 * Utilise Supabase Realtime pour recevoir les changements instantanément
 */
export function useRealtimeMovieAvailability(
  movieId: string,
  initialCopies?: number
): UseRealtimeMovieAvailabilityReturn {
  const [copiesDisponibles, setCopiesDisponibles] = useState<number | null>(
    initialCopies ?? null
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // S'abonner aux changements de la table movies pour ce film spécifique
    const channel = supabase
      .channel(`movie-availability-${movieId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'movies',
          filter: `id=eq.${movieId}`,
        },
        (payload) => {
          // Mise à jour reçue - extraire le nouveau nombre de copies disponibles
          const newCopies = payload.new?.copies_disponibles

          if (typeof newCopies === 'number') {
            console.log(
              `📡 [Realtime] Film ${movieId} - Copies disponibles mises à jour: ${newCopies}`
            )
            setCopiesDisponibles(newCopies)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [Realtime] Abonné aux mises à jour du film ${movieId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ [Realtime] Erreur d'abonnement pour le film ${movieId}`)
        }
      })

    // Cleanup : se désabonner quand le composant est démonté
    return () => {
      console.log(`🔌 [Realtime] Désabonnement du film ${movieId}`)
      supabase.removeChannel(channel)
    }
  }, [movieId])

  return {
    copiesDisponibles,
    loading,
  }
}
