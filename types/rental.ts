/**
 * Données d'un emprunt/location dans le store
 */
export interface RentalData {
  movieId: string
  isRented: boolean
  rentalId: string | null
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
