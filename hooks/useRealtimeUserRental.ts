'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'

interface UseRealtimeUserRentalReturn {
  isCurrentlyRented: boolean | null
  rentalId: string | null
  expiresAt: string | null
}

/**
 * Hook pour s'abonner aux emprunts de l'utilisateur en temps réel
 * Détecte instantanément quand un film est loué ou rendu
 */
export function useRealtimeUserRental(movieId: string): UseRealtimeUserRentalReturn {
  const { user } = useAuth()
  const [isCurrentlyRented, setIsCurrentlyRented] = useState<boolean | null>(null)
  const [rentalId, setRentalId] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  useEffect(() => {
    // Si pas d'utilisateur, pas de location possible
    if (!user || !movieId) {
      setIsCurrentlyRented(false)
      setRentalId(null)
      setExpiresAt(null)
      return
    }

    const supabase = createClient()

    // Fonction pour vérifier l'état initial
    const checkInitialState = async () => {
      const { data, error } = await supabase
        .from('emprunts')
        .select('id, date_retour, statut')
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
        .eq('statut', 'en_cours')
        .maybeSingle()

      if (!error && data) {
        setIsCurrentlyRented(true)
        setRentalId(data.id)
        setExpiresAt(data.date_retour)
        console.log(`📡 [Realtime Rental] État initial: Film ${movieId} loué`)
      } else {
        setIsCurrentlyRented(false)
        setRentalId(null)
        setExpiresAt(null)
        console.log(`📡 [Realtime Rental] État initial: Film ${movieId} non loué`)
      }
    }

    // Vérifier l'état initial
    checkInitialState()

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel(`user-rental-${user.id}-${movieId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emprunts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Vérifier si c'est pour ce film
          if (payload.new.movie_id === movieId && payload.new.statut === 'en_cours') {
            console.log(`📡 [Realtime Rental] INSERT détecté: Film ${movieId} loué`)
            setIsCurrentlyRented(true)
            setRentalId(payload.new.id)
            setExpiresAt(payload.new.date_retour)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emprunts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Vérifier si c'est pour ce film
          if (payload.new.movie_id === movieId) {
            if (payload.new.statut === 'en_cours') {
              console.log(`📡 [Realtime Rental] UPDATE détecté: Film ${movieId} toujours loué`)
              setIsCurrentlyRented(true)
              setRentalId(payload.new.id)
              setExpiresAt(payload.new.date_retour)
            } else {
              console.log(`📡 [Realtime Rental] UPDATE détecté: Film ${movieId} rendu`)
              setIsCurrentlyRented(false)
              setRentalId(null)
              setExpiresAt(null)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'emprunts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Vérifier si c'est pour ce film
          if (payload.old.movie_id === movieId) {
            console.log(`📡 [Realtime Rental] DELETE détecté: Film ${movieId} supprimé`)
            setIsCurrentlyRented(false)
            setRentalId(null)
            setExpiresAt(null)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [Realtime Rental] Abonné aux emprunts de l'user ${user.id} pour film ${movieId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ [Realtime Rental] Erreur d'abonnement pour film ${movieId}`)
        }
      })

    // Cleanup
    return () => {
      console.log(`🔌 [Realtime Rental] Désabonnement film ${movieId}`)
      supabase.removeChannel(channel)
    }
  }, [user, movieId])

  return {
    isCurrentlyRented,
    rentalId,
    expiresAt,
  }
}
