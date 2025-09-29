"use client"

import { Play, XCircle } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useHydration } from "@/hooks"
import { usePlayButton } from "@/hooks/usePlayButton"
import { useMovieRentalStore } from "@/stores/rental-store"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { PaymentChoiceModal } from "@/components/ui/payment-choice-modal"
import { ICON_SIZES, HOVER_SCALE_CLASSES, FOCUS_CLASSES } from "@/constants"

interface PlayButtonProps {
  movieId: string
  className?: string
  disabled?: boolean
  copiesDisponibles?: number
}

export function PlayButtonCompact({ movieId, className, disabled = false, copiesDisponibles }: PlayButtonProps) {
  const { isHydrated } = useHydration()
  const { handleClick, getAction } = usePlayButton()
  const { user } = useAuth()
  const { hasActiveSubscription } = useSubscription(user)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Utiliser uniquement le store Zustand pour les emprunts (comme le bouton Like)
  const { isCurrentlyRented, loading } = useMovieRentalStore(movieId)

  // Vérifier la disponibilité : désactiver SI pas déjà emprunté ET aucune copie disponible
  const isUnavailable = !isCurrentlyRented && copiesDisponibles === 0

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled || isUnavailable) return

    handleClick(movieId, isCurrentlyRented, loading, () => setShowPaymentModal(true))
  }

  // Obtenir l'action actuelle
  const action = getAction(movieId, isCurrentlyRented, loading)

  // Détermine l'apparence selon l'action
  const getButtonProps = () => {
    // Si film indisponible, afficher en rouge/grisé
    if (isUnavailable) {
      return {
        ariaLabel: "Film indisponible",
        iconClass: "text-red-400/50",
        tooltipMessage: "Film indisponible"
      }
    }

    switch (action) {
      case 'login':
        return {
          ariaLabel: "Connectez-vous pour regarder le film",
          iconClass: "text-yellow-400/70 hover:text-yellow-400 fill-yellow-400/70 hover:fill-yellow-400",
          tooltipMessage: "Connectez-vous pour regarder"
        }
      case 'play':
        const playLabel = hasActiveSubscription
          ? "Regarder le film (Abonnement)"
          : "Regarder le film (Loué)"
        return {
          ariaLabel: playLabel,
          iconClass: "text-green-400/70 hover:text-green-400 fill-green-400/70 hover:fill-green-400",
          tooltipMessage: playLabel
        }
      case 'payment':
        return {
          ariaLabel: "Louer ou s'abonner pour regarder le film",
          iconClass: "text-blue-400/70 hover:text-blue-400 fill-blue-400/70 hover:fill-blue-400",
          tooltipMessage: "Louer ou s'abonner"
        }
      default: // loading
        return {
          ariaLabel: "Chargement...",
          iconClass: "text-white/70 hover:text-white fill-white/70 hover:fill-white",
          tooltipMessage: "Chargement..."
        }
    }
  }

  // Return invisible placeholder during hydration to maintain layout
  if (!isHydrated) {
    return (
      <div
        className="absolute top-2 left-2 z-10 w-10 h-10 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    )
  }

  const { ariaLabel, iconClass, tooltipMessage } = getButtonProps()
  const isLoading = action === 'loading'

  const buttonContent = (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleButtonClick}
      disabled={disabled || isLoading || isUnavailable}
      className={cn(
        "play-button absolute top-2 left-2 z-10",
        "bg-black/20 backdrop-blur-sm",
        !isUnavailable && "hover:bg-black/40",
        "border border-white/20",
        !isUnavailable && "hover:border-white hover:border-2",
        "rounded-full",
        // Force invisible state initially, only show on group hover
        "invisible opacity-0",
        "group-hover:visible group-hover:opacity-100",
        "transition-all duration-200 ease-out",
        !isUnavailable && HOVER_SCALE_CLASSES.SUBTLE,
        FOCUS_CLASSES.DEFAULT,
        isLoading && "animate-pulse",
        isUnavailable && "cursor-not-allowed opacity-60",
        className
      )}
      aria-label={ariaLabel}
    >
      {isUnavailable ? (
        <XCircle
          size={ICON_SIZES.COMPACT}
          className={cn("transition-all duration-200", iconClass)}
        />
      ) : (
        <Play
          size={ICON_SIZES.COMPACT}
          className={cn(
            "transition-all duration-200",
            iconClass,
            isLoading && "animate-spin"
          )}
        />
      )}
    </Button>
  )

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-zinc-900 border-zinc-700">
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Modale de choix de paiement */}
      <PaymentChoiceModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        movieId={movieId}
      />
    </>
  )
}
