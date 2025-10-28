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
  p_payment_id?: string | null
}

/**
 * Résultat de la RPC rent_or_access_movie
 */
export interface RentOrAccessMovieResult {
  success: boolean
  emprunt_id?: string
  existing_rental?: boolean
  previous_rental_released?: boolean
  previous_rental_id?: string
  rental_type?: 'subscription' | 'paid'
  amount_charged?: number
  movie_title?: string
  expires_at?: string
  error?: string
  requires_payment_choice?: boolean
  code?: 'MOVIE_NOT_FOUND' | 'NO_COPIES_AVAILABLE' | 'NO_SUBSCRIPTION' | 'INTERNAL_ERROR'
}

/**
 * Type guard pour vérifier si le résultat est un succès
 */
export function isRentalSuccess(result: RentOrAccessMovieResult): result is RentOrAccessMovieResult & { success: true; emprunt_id: string } {
  return result.success === true && !!result.emprunt_id
}

/**
 * Type guard pour vérifier si le résultat nécessite un paiement
 */
export function requiresPayment(result: RentOrAccessMovieResult): result is RentOrAccessMovieResult & { requires_payment_choice: true } {
  return result.requires_payment_choice === true
}
