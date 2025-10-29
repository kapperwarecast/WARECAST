"use client"

import { DirectorCard, DirectorCardSkeleton } from "./director-card"
import type { DirectorWithMovieCount } from "@/types/director"

interface DirectorGridProps {
  directors: DirectorWithMovieCount[]
  loading?: boolean
}

export function DirectorGrid({ directors, loading = false }: DirectorGridProps) {
  if (loading) {
    return (
      <div className="director-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <DirectorCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (directors.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-zinc-400 text-lg">Aucun réalisateur trouvé</p>
          <p className="text-zinc-500 text-sm mt-2">
            Essayez une autre recherche
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="director-grid">
      {directors.map((director, index) => (
        <DirectorCard
          key={director.id}
          director={director}
          priority={index < 12}
        />
      ))}
    </div>
  )
}
