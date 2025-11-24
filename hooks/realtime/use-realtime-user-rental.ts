'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useRealtimeSubscription } from './use-realtime-subscription'
import type { UseRealtimeUserRentalReturn } from '@/types'

/**
 * Hook pour s'abonner aux sessions de visionnage de l'utilisateur en temps réel
 * Détecte instantanément quand une session est créée ou terminée
 */
export function useRealtimeUserRental(movieId: string): UseRealtimeUserRentalReturn {
  const { user } = useAuth()
  const [isCurrentlyRented, setIsCurrentlyRented] = useState<boolean | null>(null)
  const [rentalId, setRentalId] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  // Fonction pour vérifier l'état initial
  const checkInitialState = async () => {
    if (!user || !movieId) {
      setIsCurrentlyRented(false)
      setRentalId(null)
      setExpiresAt(null)
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('viewing_sessions')
      .select('id, return_date, statut')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .eq('statut', 'en_cours')
      .maybeSingle()

    if (!error && data) {
      setIsCurrentlyRented(true)
      setRentalId(data.id)
      setExpiresAt(data.return_date)
      console.log(`📡 [Realtime Rental] État initial: Film ${movieId} loué`)
    } else {
      setIsCurrentlyRented(false)
      setRentalId(null)
      setExpiresAt(null)
      console.log(`📡 [Realtime Rental] État initial: Film ${movieId} non loué`)
    }
  }

  // Utiliser le hook générique Realtime
  useRealtimeSubscription({
    channelName: `user-rental-${user?.id}-${movieId}`,
    enabled: !!user && !!movieId,
    initialStateFetcher: checkInitialState,
    listeners: [
      {
        config: {
          event: 'INSERT',
          schema: 'public',
          table: 'viewing_sessions',
          filter: `user_id=eq.${user?.id}`,
        },
        handler: (payload) => {
          const newRecord = payload.new as { movie_id?: string; statut?: string; id?: string; return_date?: string }
          if (newRecord.movie_id === movieId && newRecord.statut === 'en_cours') {
            console.log(`📡 [Realtime Rental] INSERT détecté: Film ${movieId} loué`)
            setIsCurrentlyRented(true)
            setRentalId(newRecord.id || null)
            setExpiresAt(newRecord.return_date || null)
          }
        },
      },
      {
        config: {
          event: 'UPDATE',
          schema: 'public',
          table: 'viewing_sessions',
          filter: `user_id=eq.${user?.id}`,
        },
        handler: (payload) => {
          const newRecord = payload.new as { movie_id?: string; statut?: string; id?: string; return_date?: string }
          if (newRecord.movie_id === movieId) {
            if (newRecord.statut === 'en_cours') {
              console.log(`📡 [Realtime Rental] UPDATE détecté: Film ${movieId} toujours loué`)
              setIsCurrentlyRented(true)
              setRentalId(newRecord.id || null)
              setExpiresAt(newRecord.return_date || null)
            } else {
              console.log(`📡 [Realtime Rental] UPDATE détecté: Film ${movieId} rendu`)
              setIsCurrentlyRented(false)
              setRentalId(null)
              setExpiresAt(null)
            }
          }
        },
      },
      {
        config: {
          event: 'DELETE',
          schema: 'public',
          table: 'viewing_sessions',
          filter: `user_id=eq.${user?.id}`,
        },
        handler: (payload) => {
          const oldRecord = payload.old as { movie_id?: string }
          if (oldRecord.movie_id === movieId) {
            console.log(`📡 [Realtime Rental] DELETE détecté: Film ${movieId} supprimé`)
            setIsCurrentlyRented(false)
            setRentalId(null)
            setExpiresAt(null)
          }
        },
      },
    ],
  })

  return {
    isCurrentlyRented,
    rentalId,
    expiresAt,
  }
}
