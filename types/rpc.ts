/**
 * Types TypeScript pour les fonctions RPC Supabase
 * Garantit la sécurité des types lors des appels RPC
 */

/**
 * Paramètres pour la RPC rent_or_access_movie
 */
export interface RentOrAccessMovieParams {
  p_movie_id: string
  p_auth_user_id: string
  p_registry_id?: string  // ✅ Support multi-copies physiques
  p_payment_id?: string | null
}

/**
 * Résultat de la RPC rent_or_access_movie
 * NOUVEAU: Inclut registry_id pour support multi-copies physiques
 */
export interface RentOrAccessMovieResult {
  success: boolean
  session_id?: string  // ID de la viewing_session créée
  registry_id?: string  // ID de la copie physique (films_registry.id)
  existing_rental?: boolean
  previous_rental_released?: boolean
  previous_rental_id?: string
  rental_type?: 'subscription' | 'paid'
  amount_charged?: number
  movie_title?: string
  expires_at?: string
  error?: string
  requires_payment_choice?: boolean
  owns_film?: boolean
  exchange_performed?: boolean
  exchange_id?: string
  amount?: number
  code?: 'MOVIE_NOT_FOUND' | 'NO_COPIES_AVAILABLE' | 'NO_SUBSCRIPTION' | 'PAYMENT_REQUIRED' | 'FILM_NOT_IN_REGISTRY' | 'FILM_NOT_AVAILABLE' | 'NO_FILM_TO_EXCHANGE' | 'PAYMENT_NOT_FOUND' | 'PAYMENT_NOT_SUCCEEDED' | 'INTERNAL_ERROR'
}

/**
 * Type guard pour vérifier si le résultat est un succès
 */
export function isRentalSuccess(result: RentOrAccessMovieResult): result is RentOrAccessMovieResult & { success: true; session_id: string } {
  return result.success === true && !!result.session_id
}

/**
 * Type guard pour vérifier si le résultat nécessite un paiement
 */
export function requiresPayment(result: RentOrAccessMovieResult): result is RentOrAccessMovieResult & { requires_payment_choice: true } {
  return result.requires_payment_choice === true
}
