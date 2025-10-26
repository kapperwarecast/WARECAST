'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/hooks/use-subscription'

export type AccessStatus =
  | 'loading'           // Vérification en cours
  | 'creating_rental'   // Création d'emprunt pour abonné
  | 'granted'           // Accès autorisé
  | 'redirect'          // Redirection nécessaire

interface UseMovieAccessReturn {
  status: AccessStatus
  shouldRedirect: string | null // URL de redirection si nécessaire
  error: string | null // Erreur éventuelle
}

export function useMovieAccess(movieId: string): UseMovieAccessReturn {
  const [status, setStatus] = useState<AccessStatus>('loading')
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { hasActiveSubscription, loadingUserSubscription } = useSubscription(user)

  const checkAccess = useCallback(async () => {
    try {
      // 1. User non connecté -> redirection login
      if (!user) {
        setShouldRedirect('/auth/login')
        setStatus('redirect')
        return
      }

      // 2. Attendre le chargement de l'abonnement
      if (loadingUserSubscription) {
        setStatus('loading')
        return
      }

      // 3. User abonné -> vérifier d'abord si emprunt existe déjà
      if (hasActiveSubscription) {
        try {
          // Vérifier d'abord si l'utilisateur a déjà un emprunt actif sur ce film
          const rentalCheckResponse = await fetch(`/api/movie-rental-status/${movieId}`)

          if (rentalCheckResponse.ok) {
            const rentalData = await rentalCheckResponse.json()

            // Si déjà emprunté, accès direct sans créer de nouvel emprunt
            if (rentalData.isCurrentlyRented) {
              setStatus('granted')
              return
            }
          }

          // Pas d'emprunt existant -> créer un nouvel emprunt
          setStatus('creating_rental')

          const response = await fetch('/api/rentals/create-subscription-borrow', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ movieId })
          })

          if (!response.ok) {
            const errorData = await response.json()

            // Si aucune copie disponible, rediriger vers catalogue avec message
            if (response.status === 409) {
              setError('Aucune copie disponible pour ce film')
              setShouldRedirect('/')
              setStatus('redirect')
              return
            }

            throw new Error(errorData.error || 'Erreur lors de la création de l\'emprunt')
          }

          // Emprunt créé avec succès -> accès autorisé
          setStatus('granted')
          return

        } catch (err) {
          console.error('Erreur création emprunt abonné:', err)
          setError(err instanceof Error ? err.message : 'Erreur inconnue')
          setShouldRedirect('/')
          setStatus('redirect')
          return
        }
      }

      // 4. Vérification rapide des locations pour users non abonnés
      const response = await fetch(`/api/movie-rental-status/${movieId}`)

      if (!response.ok) {
        // En cas d'erreur, redirection vers catalogue
        setShouldRedirect('/')
        setStatus('redirect')
        return
      }

      const data = await response.json()

      if (data.isCurrentlyRented) {
        setStatus('granted')
      } else {
        // Pas de location -> retour catalogue
        setShouldRedirect('/')
        setStatus('redirect')
      }

    } catch (err) {
      console.error('Movie access check failed:', err)
      // En cas d'erreur, redirection sécurisée vers catalogue
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setShouldRedirect('/')
      setStatus('redirect')
    }
  }, [movieId, user, hasActiveSubscription, loadingUserSubscription])

  useEffect(() => {
    checkAccess()
  }, [checkAccess])

  return {
    status,
    shouldRedirect,
    error
  }
}
