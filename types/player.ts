import type { Movie } from "@/types/movie"

export interface MoviePlayerProps {
  movieId: string
}

export interface VideoPlayerProps {
  vimeoUrl: string | null
  title: string
  /** Position de départ en secondes (pour la reprise) */
  startTime?: number
  /** ID du film pour le tracking de position */
  movieId: string
  /** ID de l'emprunt actif */
  rentalId: string
}

export interface MovieInfoProps {
  movie: MovieWithPlayer
  className?: string
}

export interface MovieWithPlayer extends Movie {
  movie_directors?: Array<{
    directors: {
      nom_complet: string
    } | null
  }>
}

// Utility type for extracted Vimeo ID
export interface VimeoVideoData {
  id: string | null
  isValid: boolean
  embedUrl: string | null
}