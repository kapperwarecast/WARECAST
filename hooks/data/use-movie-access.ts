'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

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

      // 2. VÉRIFIER L'EXISTENCE d'un emprunt en cours (sans créer)
      //    Le player ne fait QUE vérifier que l'user a accès
      //    La création de l'emprunt se fait AVANT (dans le bouton Play)
      const supabase = createClient()

      const { data: rental, error: rentalError } = await supabase
        .from('emprunts')
        .select('id, date_retour')
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
        .eq('statut', 'en_cours')
        .single()

      console.log('[MOVIE ACCESS] Rental check:', { rental, error: rentalError })

      // 3. Gérer l'absence d'emprunt
      if (rentalError || !rental) {
        console.error('[MOVIE ACCESS] No active rental found for this movie')
        setError('Vous n\'avez pas loué ce film')
        setShouldRedirect('/')
        setStatus('redirect')
        return
      }

      // 4. Succès ! L'user a bien un emprunt en cours
      console.log('[MOVIE ACCESS] Access granted - Rental ID:', rental.id)
      setStatus('granted')

    } catch (err) {
      console.error('[MOVIE ACCESS] Unexpected error:', err)
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
