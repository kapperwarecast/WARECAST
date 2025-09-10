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