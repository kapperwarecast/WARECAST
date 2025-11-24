"use client"

import { MovieCard, MovieCardSkeleton } from "./movie-card"
import type { MovieWithDirector, OwnedFilm } from "@/types/movie"

interface MovieGridProps {
  movies?: MovieWithDirector[]       // For catalog browsing
  ownedFilms?: OwnedFilm[]           // For "Mes Films" page
  loading?: boolean
}

export function MovieGrid({ movies, ownedFilms, loading = false }: MovieGridProps) {
  if (loading) {
    return (
      <div className="movie-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Check if we have any content
  const hasContent = (movies && movies.length > 0) || (ownedFilms && ownedFilms.length > 0)

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-zinc-400 text-lg">Aucun film disponible</p>
          <p className="text-zinc-500 text-sm mt-2">
            Veuillez ajouter des films à votre bibliothèque
          </p>
        </div>
      </div>
    )
  }

  // Render owned films with registry_id
  if (ownedFilms) {
    return (
      <div className="movie-grid">
        {ownedFilms.map((ownedFilm, index) => (
          <MovieCard
            key={ownedFilm.registry_id}  // ✅ UNIQUE key for each physical copy
            movie={ownedFilm.movie}
            registryId={ownedFilm.registry_id}
            hasActiveSession={ownedFilm.has_active_session}
            priority={index < 8}
          />
        ))}
      </div>
    )
  }

  // Render catalog movies (no registry_id)
  return (
    <div className="movie-grid">
      {movies?.map((movie, index) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          priority={index < 8}
        />
      ))}
    </div>
  )
}