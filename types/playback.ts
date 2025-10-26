/**
 * Données nécessaires pour déterminer l'état du bouton Play
 * Utilisé pour le Server-Side Rendering (SSR)
 */
export interface MoviePlayData {
  hasActiveSubscription: boolean
  isCurrentlyRented: boolean
  rentalExpiresAt: string | null
  copiesDisponibles: number
}

/**
 * Type d'action du bouton Play
 */
export type PlayButtonAction =
  | 'login'           // User non connecté -> redirection login
  | 'play'            // User abonné ou film loué -> player direct
  | 'payment'         // User non abonné sans location -> modal paiement
  | 'loading'         // État de chargement
