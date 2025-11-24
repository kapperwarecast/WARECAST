"use client"

import { cn } from "@/lib/utils"
import { PlayButtonCompact } from "@/components/ui/play-button-improved"
import { LikeButtonCompact } from "@/components/ui/like-button"
import type { MoviePlayData } from "@/types"

interface MovieActionButtonsProps {
  movieId: string
  registryId?: string  // For owned films (multi-copy support)
  className?: string
  initialPlayData?: MoviePlayData
}

/**
 * Composant réutilisable pour afficher les boutons d'action Play et Like d'un film
 *
 * @param movieId - ID du film
 * @param registryId - ID de la copie physique (pour films possédés)
 * @param className - Classes CSS additionnelles
 * @param initialPlayData - Données SSR du bouton play (optionnel)
 */
export function MovieActionButtons({
  movieId,
  registryId,
  className,
  initialPlayData,
}: MovieActionButtonsProps) {
  return (
    <div className={cn("flex flex-row items-center gap-2 mb-3", className)}>
      <PlayButtonCompact
        movieId={movieId}
        registryId={registryId}
        initialPlayData={initialPlayData}
        className="!relative !top-auto !left-auto !visible !opacity-100"
      />
      <LikeButtonCompact
        movieId={movieId}
        className="!relative !top-auto !right-auto !visible !opacity-100"
      />
    </div>
  )
}
