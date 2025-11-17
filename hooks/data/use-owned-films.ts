"use client"

import React from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import type { MovieWithDirector } from "@/types/movie"

export interface OwnedFilmComplete {
  registry_id: string
  movie_id: string
  has_active_session: boolean
  movie: MovieWithDirector
}

interface UseOwnedFilmsReturn {
  films: OwnedFilmComplete[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook pour récupérer les films possédés par l'utilisateur
 * Inclut l'information si le film a une session active (en cours de lecture)
 */
export function useOwnedFilms(): UseOwnedFilmsReturn {
  const { user } = useAuth()
  const [films, setFilms] = React.useState<OwnedFilmComplete[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchOwnedFilms = React.useCallback(async () => {
    if (!user) {
      setFilms([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Récupérer les films possédés par l'utilisateur avec métadonnées complètes
      const { data: registryData, error: registryError } = await supabase
        .from("films_registry")
        .select(
          `
          id,
          movie_id,
          movies (
            id,
            slug,
            titre_francais,
            titre_original,
            annee_sortie,
            duree,
            langue_vo,
            poster_local_path,
            synopsis,
            created_at,
            genres,
            lien_vimeo,
            note_tmdb,
            random_order,
            search_vector,
            statut,
            subtitle_path,
            tmdb_id,
            updated_at,
            movie_directors (
              directors (
                id,
                nom_complet
              )
            )
          )
        `
        )
        .eq("current_owner_id", user.id)

      if (registryError) {
        console.error("Erreur récupération films possédés:", registryError)
        setError("Erreur lors du chargement de vos films")
        setFilms([])
        return
      }

      // Récupérer les sessions actives de l'utilisateur
      const { data: sessionsData } = await supabase
        .from("emprunts")
        .select("movie_id")
        .eq("user_id", user.id)
        .eq("statut", "en_cours")
        .gt("date_retour", new Date().toISOString())

      const activeMovieIds = new Set(
        (sessionsData || []).map((s) => s.movie_id)
      )

      // Combiner les données avec métadonnées complètes du film
      const ownedFilms: OwnedFilmComplete[] = (registryData || [])
        .filter((film: any) => film.movies) // Filtrer les films sans données
        .map((film: any) => ({
          registry_id: film.id,
          movie_id: film.movie_id,
          has_active_session: activeMovieIds.has(film.movie_id),
          movie: {
            id: film.movies.id,
            slug: film.movies.slug,
            titre_francais: film.movies.titre_francais,
            titre_original: film.movies.titre_original,
            annee_sortie: film.movies.annee_sortie,
            duree: film.movies.duree,
            langue_vo: film.movies.langue_vo,
            poster_local_path: film.movies.poster_local_path,
            synopsis: film.movies.synopsis,
            created_at: film.movies.created_at,
            genres: film.movies.genres,
            lien_vimeo: film.movies.lien_vimeo,
            note_tmdb: film.movies.note_tmdb,
            random_order: film.movies.random_order,
            search_vector: film.movies.search_vector,
            statut: film.movies.statut,
            subtitle_path: film.movies.subtitle_path,
            tmdb_id: film.movies.tmdb_id,
            updated_at: film.movies.updated_at,
            movie_directors: film.movies.movie_directors || [],
          },
        }))

      setFilms(ownedFilms)
    } catch (err) {
      console.error("Erreur useOwnedFilms:", err)
      setError("Erreur interne")
      setFilms([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Charger les films au montage et quand l'utilisateur change
  React.useEffect(() => {
    fetchOwnedFilms()
  }, [fetchOwnedFilms])

  return {
    films,
    loading,
    error,
    refresh: fetchOwnedFilms,
  }
}
