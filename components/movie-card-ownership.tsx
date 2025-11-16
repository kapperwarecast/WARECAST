"use client"

import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Disc, Disc3 } from "lucide-react"
import type { UserFilm } from "@/types/ownership"
import { cn } from "@/lib/utils"

interface MovieCardOwnershipProps {
  film: UserFilm
}

function getPosterUrl(path: string | null): string {
  if (!path) return "/placeholder-poster.png"

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  if (path.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w500${path}`
  }

  return path
}

function getSupportIcon(supportType: "Blu-ray" | "DVD") {
  if (supportType === "Blu-ray") {
    return <Disc3 className="w-3 h-3" />
  }
  return <Disc className="w-3 h-3" />
}

function getSupportColor(supportType: "Blu-ray" | "DVD") {
  if (supportType === "Blu-ray") {
    return "bg-blue-950/30 text-blue-400 border-blue-800/30"
  }
  return "bg-purple-950/30 text-purple-400 border-purple-800/30"
}

export function MovieCardOwnership({ film }: MovieCardOwnershipProps) {
  const title = film.titre_francais || film.titre_original || "Sans titre"
  const posterUrl = getPosterUrl(film.poster_local_path)
  const slug = film.slug || film.movie_id

  return (
    <Link href={`/film/${slug}`}>
      <Card className="group relative overflow-hidden bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
        {/* Support type badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium flex items-center gap-1",
              getSupportColor(film.physical_support_type)
            )}
          >
            {getSupportIcon(film.physical_support_type)}
            {film.physical_support_type}
          </Badge>
        </div>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[5] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
            <span className="text-white text-sm font-medium">Regarder</span>
          </div>
        </div>

        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>

        {/* Film info */}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-white line-clamp-2 text-sm min-h-[2.5rem]">
            {title}
          </h3>

          {film.annee_sortie && (
            <p className="text-xs text-zinc-500">{film.annee_sortie}</p>
          )}

          {/* Acquisition info */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {film.acquisition_method === 'deposit' && (
              <span>📦 Dépôt</span>
            )}
            {film.acquisition_method === 'exchange' && (
              <span>🔄 Échange</span>
            )}
            {film.acquisition_method === 'sponsorship' && (
              <span>🎁 Parrainage</span>
            )}
            {film.acquisition_date && (
              <>
                <span>•</span>
                <span>
                  {new Date(film.acquisition_date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'short'
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
