import type { Tables } from "@/lib/supabase/types"

export type Movie = Tables<"movies">

export interface MovieWithDirector extends Movie {
  movie_directors?: Array<{
    directors: {
      nom_complet: string
    } | null
  }>
}

export function getDirectorName(movie: MovieWithDirector): string | undefined {
  return movie.movie_directors?.[0]?.directors?.nom_complet
}

/**
 * Represents a film that the user OWNS (physical copy)
 * Includes registry_id for multi-copy support
 */
export interface OwnedFilm {
  registry_id: string          // Unique physical copy identifier
  movie_id: string             // Movie catalog ID (can have duplicates)
  has_active_session: boolean  // Is user currently watching this copy?
  movie: MovieWithDirector     // Complete movie metadata
}