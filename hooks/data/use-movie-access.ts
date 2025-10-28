'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import type { RentOrAccessMovieResult } from '@/types/rpc'

export type AccessStatus =
  | 'loading'    // Vérification en cours
  | 'granted'    // Accès autorisé
  | 'redirect'   // Redirection nécessaire

interface UseMovieAccessReturn {
  status: AccessStatus
  shouldRedirect: string | null
  error: string | null
}

export function useMovieAccess(movieId: string): UseMovieAccessReturn {
  const [status, setStatus] = useState<AccessStatus>('loading')
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const checkAccess = useCallback(async () => {
    try {
      // 1. User non connecté -> redirection login
      if (!user) {
        setShouldRedirect('/auth/login')
        setStatus('redirect')
        return
      }

      // 2. APPEL RPC DIRECT - Fait TOUT en une seule opération atomique :
      //    ✅ Vérifie abonnement actif
      //    ✅ Vérifie copies disponibles
      //    ✅ Libère ancien emprunt si existe (abonnés)
      //    ✅ Crée nouvel emprunt
      //    ✅ Triggers gèrent copies_disponibles automatiquement
      const supabase = createClient()

      const { data, error: rpcError } = await supabase.rpc('rent_or_access_movie', {
        p_movie_id: movieId,
        p_auth_user_id: user.id,
        p_payment_id: undefined
      })

      console.log('[RENTAL] RPC response:', { data, error: rpcError })

      // 3. Gérer les erreurs RPC
      if (rpcError) {
        console.error('[RENTAL] RPC error:', rpcError)
        setError('Erreur technique lors de la vérification')
        setShouldRedirect('/')
        setStatus('redirect')
        return
      }

      // Cast le résultat vers le type RPC
      const result = data as unknown as RentOrAccessMovieResult

      // 4. Vérifier le succès de l'opération
      if (!result || !result.success) {
        const errorMsg = result?.error || 'Erreur inconnue'
        console.error('[RENTAL] Operation failed:', errorMsg)

        // Messages d'erreur clairs selon le cas
        if (errorMsg.includes('copie') || errorMsg.includes('disponible')) {
          setError('Aucune copie disponible pour ce film')
        } else if (errorMsg.includes('abonnement') || errorMsg.includes('payment')) {
          setError('Abonnement requis ou paiement manquant')
        } else {
          setError(errorMsg)
        }

        setShouldRedirect('/')
        setStatus('redirect')
        return
      }

      // 5. Succès ! Accès autorisé
      console.log('[RENTAL] Access granted:', {
        rentalId: result.emprunt_id,
        existingRental: result.existing_rental,
        previousReleased: result.previous_rental_released
      })

      setStatus('granted')

    } catch (err) {
      console.error('[RENTAL] Unexpected error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setShouldRedirect('/')
      setStatus('redirect')
    }
  }, [movieId, user])

  useEffect(() => {
    checkAccess()
  }, [checkAccess])

  return {
    status,
    shouldRedirect,
    error
  }
}
