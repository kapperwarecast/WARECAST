"use client"

import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LikeButtonCompact } from "@/components/ui/like-button"
import { PlayButtonCompact } from "@/components/ui/play-button-improved"
import { useState, useRef, useEffect } from "react"
import type { MovieWithDirector } from "@/types/movie"
import { getDirectorName } from "@/types/movie"
import { formatDuration, getLanguageName } from "@/lib/utils/format"
import { useRealtimeMovieAvailability } from "@/hooks/useRealtimeMovieAvailability"

interface MovieCardProps {
  movie: MovieWithDirector
  priority?: boolean
}

export function MovieCard({ movie, priority = false }: MovieCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // S'abonner aux mises à jour en temps réel du nombre de copies disponibles
  const { copiesDisponibles: realtimeCopies } = useRealtimeMovieAvailability(
    movie.id,
    movie.copies_disponibles
  )

  // Utiliser la valeur en temps réel si disponible, sinon la valeur initiale
  const effectiveCopies = realtimeCopies ?? movie.copies_disponibles

  // Intersection Observer pour lazy loading intelligent
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '200px', // Commence à charger 200px avant d'être visible
        threshold: 0.01
      }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const frenchTitle = movie.titre_francais || "Sans titre"
  const originalTitle = movie.titre_original
  const year = movie.annee_sortie
  const director = getDirectorName(movie)
  const duration = formatDuration(movie.duree)
  const language = movie.langue_vo
  
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
      <Card 
        ref={cardRef}
        className="relative overflow-hidden bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-300 group cursor-pointer py-0 [&:hover_.like-button]:visible [&:hover_.like-button]:opacity-100 [&:hover_.play-button]:visible [&:hover_.play-button]:opacity-100">
      <div className="relative aspect-[2/3] w-full bg-zinc-800">
        {imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 animate-pulse" />
        )}
        {isVisible && !imageError && posterUrl ? (
          <Image
            src={posterUrl}
            alt={frenchTitle}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            quality={75}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            onError={() => {
              setImageError(true)
              setImageLoading(false)
            }}
            onLoad={() => setImageLoading(false)}
          />
        ) : isVisible && imageError ? (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-zinc-500 text-sm font-medium mb-1">{frenchTitle}</p>
              {year && <p className="text-zinc-600 text-xs">{year}</p>}
            </div>
          </div>
        ) : null}

        {/* Play button - positioned on the left */}
        <PlayButtonCompact
          movieId={movie.id}
          copiesDisponibles={effectiveCopies}
        />

        {/* Like button - always visible but more prominent on hover */}
        <LikeButtonCompact movieId={movie.id} />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            {/* Titre français */}
            <h3 className="text-white font-semibold text-base line-clamp-2 mb-1">
              {frenchTitle}
            </h3>
            
            {/* Titre original (italique) */}
            {originalTitle && originalTitle !== frenchTitle && (
              <p className="text-zinc-300 text-sm italic line-clamp-1 mb-1">
                {originalTitle}
              </p>
            )}
            
            {/* Réalisateur */}
            {director && (
              <p className="text-zinc-400 text-sm mb-1">
                {director}
              </p>
            )}
            
            {/* Année et durée */}
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              {year && <span>{year}</span>}
              {year && duration && <span>•</span>}
              {duration && <span>{duration}</span>}
            </div>
            
            {/* Langue */}
            {language && (
              <p className="text-zinc-400 text-sm">
                Langue : {getLanguageName(language)}
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