'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/hooks/use-subscription'

export type PlayButtonAction = 
  | 'login'           // User non connecté -> redirection login
  | 'play'            // User abonné ou film loué -> player direct
  | 'payment'         // User non abonné sans location -> modal paiement
  | 'loading'         // État de chargement

interface UsePlayButtonReturn {
  isLoading: boolean
  handleClick: (movieId: string, isCurrentlyRented: boolean, loadingRental: boolean, openPaymentModal: () => void) => void
  getAction: (movieId: string, isCurrentlyRented: boolean, loadingRental: boolean) => PlayButtonAction
}

export function usePlayButton(): UsePlayButtonReturn {
  const router = useRouter()
  const { user } = useAuth()
  const { hasActiveSubscription, loadingUserSubscription } = useSubscription(user)

  /**
   * Détermine l'action à effectuer pour le bouton play
   * Logique complète intégrant les emprunts
   */
  const getAction = useCallback((movieId: string, isCurrentlyRented: boolean, loadingRental: boolean): PlayButtonAction => {
    // 1. Si on charge encore l'abonnement ou les emprunts, on attend
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
    
    // 5. User non abonné sans location -> Payment
    return 'payment'
  }, [user, hasActiveSubscription, loadingUserSubscription])

  const handleClick = useCallback((
    movieId: string, 
    isCurrentlyRented: boolean, 
    loadingRental: boolean, 
    openPaymentModal: () => void
  ) => {
    const action = getAction(movieId, isCurrentlyRented, loadingRental)
    
    switch (action) {
      case 'login':
        router.push('/auth/login')
        break
        
      case 'play':
        router.push(`/movie-player/${movieId}`)
        break
        
      case 'payment':
        openPaymentModal()
        break
        
      case 'loading':
        // Ne rien faire, on attend
        break
    }
  }, [router, getAction])

  return {
    isLoading: loadingUserSubscription,
    handleClick,
    getAction
  }
}
