"use client"

import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { User } from "lucide-react"
import type { DirectorWithMovieCount } from "@/types/director"
import { getPersonPhotoUrl } from "@/lib/utils/person"

interface DirectorCardProps {
  director: DirectorWithMovieCount
  priority?: boolean
}

export function DirectorCard({ director, priority = false }: DirectorCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const photoUrl = getPersonPhotoUrl(director.photo_path)
  const movieCount = director.movie_count || 0

  return (
    <Link href={`/personne/directeur/${director.id}?from=directors-list`}>
      <div className="overflow-hidden transition-all duration-300 group cursor-pointer border-[0.75px] border-transparent hover:border-white">
        {/* Photo du réalisateur */}
        <div className="relative aspect-[2/3] w-full">
          {imageLoading && photoUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 animate-pulse" />
          )}
          {!imageError && photoUrl ? (
            <Image
              src={photoUrl}
              alt={director.nom_complet}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 180px"
              quality={60}
              priority={priority}
              loading={priority ? undefined : "lazy"}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzI3MjcyNyIvPjwvc3ZnPg=="
              onError={() => {
                setImageError(true)
                setImageLoading(false)
              }}
              onLoad={() => setImageLoading(false)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-16 h-16 text-zinc-600" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Nom et nombre de films */}
        <div className="p-3">
          <p className="text-white font-medium text-sm line-clamp-2 text-center mb-1">
            {director.nom_complet}
          </p>
          {movieCount > 0 && (
            <p className="text-zinc-400 text-xs text-center">
              {movieCount} {movieCount === 1 ? 'film' : 'films'}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export function DirectorCardSkeleton() {
  return (
    <div className="overflow-hidden">
      <Skeleton className="aspect-[2/3] w-full" />
      <div className="p-3">
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    </div>
  )
}
