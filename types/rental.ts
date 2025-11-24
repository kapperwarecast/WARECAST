/**
 * Données d'une session de visionnage dans le store
 * (anciennement emprunt/location)
 */
export interface RentalData {
  movieId: string
  isRented: boolean
  rentalId: string | null  // ID de la viewing_session
  expiresAt: string | null
  lastSync: number
}

/**
 * Retour du hook useRealtimeUserRental
 */
export interface UseRealtimeUserRentalReturn {
  isCurrentlyRented: boolean | null
  rentalId: string | null
  expiresAt: string | null
}

/**
 * Retour du hook useMovieRentalStore
 */
export interface UseMovieRentalStoreReturn {
  isCurrentlyRented: boolean
  rentalId: string | null
  expiresAt: string | null
  loading: boolean
  isHydrated: boolean
}
