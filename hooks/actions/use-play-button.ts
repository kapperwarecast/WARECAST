'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/hooks/use-subscription'
import { createClient } from '@/lib/supabase/client'
import type { RentOrAccessMovieResult } from '@/types/rpc'

export type PlayButtonAction = 
  | 'login'           // User non connecté -> redirection login
  | 'play'            // User abonné ou film loué -> player direct
  | 'payment'         // User non abonné sans échange -> modal paiement
  | 'loading'         // État de chargement

interface UsePlayButtonReturn {
  isLoading: boolean
  isRenting: boolean
  error: string | null
  handleClick: (movieId: string, registryId: string | undefined, isCurrentlyRented: boolean, loadingRental: boolean, openPaymentModal: () => void) => Promise<void>
  getAction: (movieId: string, isCurrentlyRented: boolean, loadingRental: boolean) => PlayButtonAction
}

export function usePlayButton(): UsePlayButtonReturn {
  const router = useRouter()
  const { user } = useAuth()
  const { hasActiveSubscription, loadingUserSubscription } = useSubscription(user)
  const [isRenting, setIsRenting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Détermine l'action à effectuer pour le bouton play
   * Logique complète intégrant les sessions de visionnage
   */
  const getAction = useCallback((movieId: string, isCurrentlyRented: boolean, loadingRental: boolean): PlayButtonAction => {
    // 1. Si on charge encore l'abonnement ou les sessions, on attend
    if (loadingUserSubscription || loadingRental) {
      return 'loading'
    }
    
    // 2. User non connecté -> Login
    if (!user) {
      return 'login'
    }
    
    // 3. User abonné -> Play direct (accès illimité)
    if (hasActiveSubscription) {
      return 'play'
    }
    
    // 4. User non abonné mais film loué en cours -> Play direct
    if (isCurrentlyRented) {
      return 'play'
    }
    
    // 5. User non abonné sans échange -> Payment
    return 'payment'
  }, [user, hasActiveSubscription, loadingUserSubscription])

  const handleClick = useCallback(async (
    movieId: string,
    registryId: string | undefined,
    isCurrentlyRented: boolean,
    loadingRental: boolean,
    openPaymentModal: () => void
  ) => {
    const action = getAction(movieId, isCurrentlyRented, loadingRental)

    // Build player URL with registryId if provided
    const buildPlayerUrl = (movieId: string) => {
      const baseUrl = `/movie-player/${movieId}`
      return registryId ? `${baseUrl}?registryId=${registryId}` : baseUrl
    }

    switch (action) {
      case 'login':
        router.push('/auth/login')
        break

      case 'play':
        // Si le film est déjà loué → Redirection directe sans appel RPC
        if (isCurrentlyRented) {
          router.push(buildPlayerUrl(movieId))
          return
        }

        // Si user abonné → Appeler la RPC pour créer la session (rotation automatique)
        if (hasActiveSubscription && user) {
          setIsRenting(true)
          setError(null)

          try {
            const supabase = createClient()
            const { data, error: rpcError } = await supabase.rpc('rent_or_access_movie', {
              p_movie_id: movieId,
              p_registry_id: registryId || undefined,  // ✅ Convert empty string to undefined for PostgreSQL
              p_auth_user_id: user.id,
              p_payment_id: undefined
            })

            if (rpcError) {
              console.error('[PLAY BUTTON] RPC error:', rpcError)
              setError('Erreur technique lors de l\'échange')
              setIsRenting(false)
              return
            }

            const result = data as unknown as RentOrAccessMovieResult

            // Vérifier si un paiement est requis (cas où RPC retourne requires_payment_choice)
            if (result && result.requires_payment_choice) {
              console.log('[PLAY BUTTON] Payment required, opening payment modal')
              openPaymentModal()
              setIsRenting(false)
              return
            }

            if (!result || !result.success) {
              const errorMsg = result?.error || 'Erreur inconnue'
              console.error('[PLAY BUTTON] Operation failed:', errorMsg)
              setError(errorMsg)
              setIsRenting(false)
              return
            }

            // Succès → Redirection vers le player
            console.log('[PLAY BUTTON] Session created:', result.session_id)
            router.push(buildPlayerUrl(movieId))
          } catch (err) {
            console.error('[PLAY BUTTON] Unexpected error:', err)
            setError(err instanceof Error ? err.message : 'Erreur inconnue')
          } finally {
            setIsRenting(false)
          }
        }
        break

      case 'payment':
        openPaymentModal()
        break

      case 'loading':
        // Ne rien faire, on attend
        break
    }
  }, [router, getAction, hasActiveSubscription, user])

  return {
    isLoading: loadingUserSubscription,
    isRenting,
    error,
    handleClick,
    getAction
  }
}
