"use client"

import { cn } from "@/lib/utils"
import { PlayButtonCompact } from "@/components/ui/play-button-improved"
import { LikeButtonCompact } from "@/components/ui/like-button-fixed"

interface MovieActionButtonsProps {
  movieId: string
  copiesDisponibles?: number
  className?: string
}

/**
 * Composant réutilisable pour afficher les boutons d'action Play et Like d'un film
 *
 * @param movieId - ID du film
 * @param copiesDisponibles - Nombre de copies disponibles (optionnel)
 * @param className - Classes CSS additionnelles
 */
export function MovieActionButtons({
  movieId,
  copiesDisponibles,
  className,
}: MovieActionButtonsProps) {
  return (
    <div className={cn("flex flex-row items-center gap-3", className)}>
      <PlayButtonCompact
        movieId={movieId}
        copiesDisponibles={copiesDisponibles}
        className="!relative !top-auto !left-auto !visible !opacity-100"
      />
      <LikeButtonCompact
        movieId={movieId}
        className="!relative !top-auto !right-auto !visible !opacity-100"
      />
    </div>
  )
}
