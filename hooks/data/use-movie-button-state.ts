"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useSubscriptionStore } from "@/stores/subscription-store"

/**
 * Type pour les infos d'accès au film retournées par le RPC
 */
interface MovieAccessInfo {
  hasActiveSession: boolean  // User a une session active (peut reprendre)
  ownsFilm: boolean          // User possède le film (peut regarder gratuitement)
  isAvailable: boolean       // Au moins une copie disponible (peut échanger/louer)
}

/**
 * États possibles du bouton Play
 */
export type ButtonState = 'free' | 'paid' | 'disabled' | 'loading'

/**
 * Résultat du hook
 */
interface UseMovieButtonStateReturn extends MovieAccessInfo {
  buttonState: ButtonState
  isLoading: boolean
}

/**
 * Hook pour déterminer l'apparence et l'état du bouton Play
 *
 * Logique de décision en cascade :
 * 1. Si hasActiveSession → 'free' (reprendre gratuitement)
 * 2. Si ownsFilm → 'free' (regarder gratuitement son film)
 * 3. Si !isAvailable → 'disabled' (toutes copies occupées)
 * 4. Si hasSubscription → 'free' (échange gratuit car abonné)
 * 5. Sinon → 'paid' (paiement 1,50€ requis)
 *
 * @param movieId - ID du film
 * @returns Informations d'accès + état du bouton
 */
export function useMovieButtonState(movieId: string): UseMovieButtonStateReturn {
  const [info, setInfo] = useState<MovieAccessInfo>({
    hasActiveSession: false,
    ownsFilm: false,
    isAvailable: false
  })
  const [isLoading, setIsLoading] = useState(true)

  const { user } = useAuth()
  const hasActiveSubscription = useSubscriptionStore(state => state.hasActiveSubscription)

  useEffect(() => {
    if (!user || !movieId) {
      setIsLoading(false)
      return
    }

    let cancelled = false
    const supabase = createClient()

    const fetchAccessInfo = async () => {
      try {
        setIsLoading(true)

        const { data, error } = await supabase.rpc('get_movie_access_info' as any, {
          p_user_id: user.id,
          p_movie_id: movieId
        })

        if (cancelled) return

        if (error) {
          console.error('[useMovieButtonState] RPC error:', error)
          // En cas d'erreur, valeurs par défaut
          setInfo({
            hasActiveSession: false,
            ownsFilm: false,
            isAvailable: false
          })
          setIsLoading(false)
          return
        }

        setInfo(data as MovieAccessInfo)
        setIsLoading(false)

        // Subscribe aux changements en temps réel
        const channel = supabase
          .channel(`movie-button-${movieId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'viewing_sessions',
              filter: `movie_id=eq.${movieId}`
            },
            () => {
              // Re-fetch quand une session change
              fetchAccessInfo()
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'films_registry',
              filter: `movie_id=eq.${movieId}`
            },
            () => {
              // Re-fetch quand une propriété change
              fetchAccessInfo()
            }
          )
          .subscribe()

        return () => {
          channel.unsubscribe()
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[useMovieButtonState] Error:', error)
          setIsLoading(false)
        }
      }
    }

    const cleanup = fetchAccessInfo()

    return () => {
      cancelled = true
      cleanup?.then(unsubscribe => unsubscribe?.())
    }
  }, [movieId, user])

  /**
   * Calcule l'état du bouton selon la logique en cascade
   */
  const getButtonState = (): ButtonState => {
    if (isLoading) return 'loading'

    // Priorité 1: Session active (reprendre gratuitement)
    if (info.hasActiveSession) return 'free'

    // Priorité 2: Possède le film (regarder gratuitement)
    if (info.ownsFilm) return 'free'

    // Priorité 3: Film indisponible (désactivé)
    if (!info.isAvailable) return 'disabled'

    // Priorité 4: Abonné (échange gratuit)
    if (hasActiveSubscription()) return 'free'

    // Sinon: Paiement requis
    return 'paid'
  }

  return {
    ...info,
    buttonState: getButtonState(),
    isLoading
  }
}
