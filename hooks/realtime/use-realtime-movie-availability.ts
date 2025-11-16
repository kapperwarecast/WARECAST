'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSubscription } from './use-realtime-subscription'
import type { UseRealtimeMovieAvailabilityReturn } from '@/types'
import type { Tables } from '@/lib/supabase/types'

/**
 * Hook pour s'abonner aux changements de disponibilité d'un film en temps réel
 *
 * NOTE: DEPRECATED - Ce hook est obsolète dans le système de propriété
 * Dans le nouveau système :
 * - Il n'y a plus de "copies disponibles"
 * - La disponibilité est basée sur la propriété (films_registry)
 * - Ce hook retourne toujours des valeurs neutres pour compatibilité
 */
export function useRealtimeMovieAvailability(
  movieId: string,
  initialCopies?: number
): UseRealtimeMovieAvailabilityReturn {
  // Dans le nouveau système, toujours retourner des valeurs neutres
  const [copiesDisponibles, setCopiesDisponibles] = useState<number | null>(null)
  const [totalRentals, setTotalRentals] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // DEPRECATED: Hook désactivé dans le système de propriété
  // Les listeners realtime ne sont plus nécessaires car :
  // - Plus de copies_disponibles
  // - Plus de table emprunts
  // - La disponibilité est gérée par films_registry

  // Hook désactivé - pas de subscription realtime
  // Ce code est conservé pour compatibilité mais ne fait rien

  return {
    copiesDisponibles,
    totalRentals,
    loading,
  }
}
