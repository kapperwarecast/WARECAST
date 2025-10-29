import type { Tables } from "@/lib/supabase/types"

/**
 * Type de base pour un réalisateur depuis la base de données
 */
export type Director = Tables<"directors">

/**
 * Réalisateur avec le nombre de films qu'il a réalisés
 * Utile pour afficher des statistiques dans les cartes
 */
export interface DirectorWithMovieCount extends Director {
  movie_count?: number
}
