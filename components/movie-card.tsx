"use client"

import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import type { Tables } from "@/lib/supabase/types"

type Movie = Tables<"movies">

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const title = movie.titre_francais || movie.titre_original || "Sans titre"
  const year = movie.annee_sortie
  
  // Handle both TMDB paths and full URLs
  const getPosterUrl = (path: string | null): string | null => {
    if (!path) return null
    
    // If it's already a full URL (Supabase storage or other), use it directly
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    
    // If it's a TMDB path (starts with /), convert to TMDB URL
    if (path.startsWith('/')) {
      return `https://image.tmdb.org/t/p/w500${path}`
    }
    
    return path
  }
  
  const posterUrl = getPosterUrl(movie.poster_local_path)

  return (
    <Link href={`/film/${movie.id}`}>
      <Card className="relative overflow-hidden bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-300 group cursor-pointer py-0">
      <div className="relative aspect-[2/3] w-full">
        {imageLoading && (
          <Skeleton className="absolute inset-0 bg-zinc-800" />
        )}
        {!imageError && posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover"
            onError={() => {
              setImageError(true)
              setImageLoading(false)
            }}
            onLoad={() => setImageLoading(false)}
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-zinc-500 text-sm font-medium mb-1">{title}</p>
              {year && <p className="text-zinc-600 text-xs">{year}</p>}
            </div>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
              {title}
            </h3>
            {year && (
              <p className="text-zinc-400 text-xs">{year}</p>
            )}
            {movie.note_tmdb && (
              <p className="text-yellow-500 text-xs mt-1">
                ★ {movie.note_tmdb.toFixed(1)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
    </Link>
  )
}

export function MovieCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-zinc-900 border-zinc-800 py-0">
      <Skeleton className="aspect-[2/3] w-full bg-zinc-800" />
    </Card>
  )
}