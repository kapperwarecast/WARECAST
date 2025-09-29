"use client"

import { MovieCardRental } from "./movie-card-rental"
import { MovieCardSkeleton } from "./movie-card"
import type { MovieWithDirector } from "@/types/movie"

interface MovieGridRentalProps {
  movies: MovieWithDirector[]
  loading?: boolean
}

export function MovieGridRental({ movies, loading = false }: MovieGridRentalProps) {
  if (loading) {
    return (
      <div className="movie-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (movies.length === 0) {
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

  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCardRental key={movie.id} movie={movie} />
      ))}
    </div>
  )
}