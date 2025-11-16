"use client"

import { MovieCardOwnership } from "./movie-card-ownership"
import { MovieCardSkeleton } from "./movie-card"
import type { UserFilm } from "@/types/ownership"

interface MovieGridOwnershipProps {
  films: UserFilm[]
  loading?: boolean
}

export function MovieGridOwnership({ films, loading = false }: MovieGridOwnershipProps) {
  if (loading) {
    return (
      <div className="movie-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (films.length === 0) {
    return null // Le message vide est géré par la page parent
  }

  return (
    <div className="movie-grid">
      {films.map((film) => (
        <MovieCardOwnership key={film.registry_id} film={film} />
      ))}
    </div>
  )
}
