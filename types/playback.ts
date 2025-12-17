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
  | 'play'            // User abonné ou film en cours -> player direct
  | 'payment'         // User non abonné sans échange -> modal paiement
  | 'loading'         // État de chargement

/**
 * Données de reprise de lecture vidéo
 * Utilisé pour proposer à l'utilisateur de reprendre où il s'est arrêté
 */
export interface VideoResumeData {
  /** Position de lecture en secondes */
  position: number
  /** Durée totale de la vidéo en secondes */
  duration: number
  /** Pourcentage de progression (0-100) */
  percentage: number
  /** Timestamp de la dernière mise à jour */
  lastWatchedAt: string
  /** ID de la session associée */
  rentalId: string
}

/**
 * Requête pour sauvegarder la position de lecture
 */
export interface SaveVideoPositionRequest {
  movieId: string
  rentalId: string
  position: number
  duration: number
}

/**
 * Réponse de l'API de reprise vidéo
 */
export interface VideoResumeResponse {
  success: boolean
  data: VideoResumeData | null
  message?: string
}
