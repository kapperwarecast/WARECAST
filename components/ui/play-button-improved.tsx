"use client"

import { Play } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useHydration } from "@/hooks/use-hydration"
import { usePlayButton } from "@/hooks/actions"
import { useMovieRentalStore } from "@/stores/rental-store"
import { useRealtimeUserRental, useRealtimeMovieAvailability } from "@/hooks/realtime"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { useFilmAvailability } from "@/hooks/data/use-film-availability"
import { PaymentChoiceModal } from "@/components/ui/payment-choice-modal"
import { ICON_SIZES, HOVER_SCALE_CLASSES, FOCUS_CLASSES } from "@/constants"
import type { MoviePlayData } from "@/types"

interface PlayButtonProps {
  movieId: string
  className?: string
  disabled?: boolean
  initialPlayData?: MoviePlayData
}

export function PlayButtonCompact({ movieId, className, disabled = false, initialPlayData }: PlayButtonProps) {
  const { isHydrated } = useHydration()
  const { handleClick, getAction } = usePlayButton()
  const { user } = useAuth()
  const { hasActiveSubscription, loadingUserSubscription } = useSubscription(user)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Utiliser Realtime pour les emprunts de l'utilisateur (instantané) avec fallback sur le store
  const { isCurrentlyRented: realtimeRented } = useRealtimeUserRental(movieId)
  const { isCurrentlyRented: storeRented, loading } = useMovieRentalStore(movieId)

  // Priorité : SSR (initial) > Realtime (updates) > Store (cache)
  const isCurrentlyRented = initialPlayData && !isHydrated
    ? initialPlayData.isCurrentlyRented
    : realtimeRented !== null
      ? realtimeRented
      : storeRented

  // Utiliser hasActiveSubscription du SSR si disponible et pas encore hydraté
  const effectiveHasActiveSubscription = initialPlayData && !isHydrated
    ? initialPlayData.hasActiveSubscription
    : hasActiveSubscription

  // Vérifier la disponibilité du film via le hook
  // Un film est disponible si son propriétaire n'a PAS de session active (48h)
  const { isAvailable, loading: loadingAvailability } = useFilmAvailability(movieId)
  const isUnavailable = !isAvailable

  // Déterminer si on est en chargement (seulement si pas de données SSR)
  const isLoading = !initialPlayData && (loading || loadingUserSubscription || loadingAvailability)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled || isUnavailable) return

    handleClick(movieId, isCurrentlyRented, isLoading, () => setShowPaymentModal(true))
  }

  // Obtenir l'action actuelle
  const action = getAction(movieId, isCurrentlyRented, isLoading)

  // Détermine l'apparence selon l'action
  const getButtonProps = () => {
    // Si film indisponible, afficher comme le bouton orange mais avec barre d'interdiction
    if (isUnavailable) {
      return {
        ariaLabel: "Film indisponible",
        iconClass: "!text-gray-400/70 !fill-gray-400/70",
        tooltipMessage: "Film indisponible",
        bgClass: "!bg-orange-600 !border-2 !border-white"
      }
    }

    switch (action) {
      case 'login':
        return {
          ariaLabel: "Connectez-vous pour regarder le film",
          iconClass: "!text-yellow-400/70 !fill-yellow-400/70",
          tooltipMessage: "Connectez-vous pour regarder",
          bgClass: "!bg-black/20 !border !border-white/20 hover:[&_svg]:!text-yellow-400 hover:[&_svg]:!fill-yellow-400"
        }
      case 'play':
        const playLabel = effectiveHasActiveSubscription
          ? "Regarder le film (Abonnement)"
          : "Regarder le film (Loué)"
        return {
          ariaLabel: playLabel,
          iconClass: "!text-white !fill-white",
          tooltipMessage: playLabel,
          bgClass: "!bg-orange-600 !border-2 !border-white hover:!bg-white hover:!border-orange-600 hover:[&_svg]:!text-orange-600 hover:[&_svg]:!fill-orange-600"
        }
      case 'payment':
        return {
          ariaLabel: "Louer ou s'abonner pour regarder le film",
          iconClass: "!text-white !fill-white",
          tooltipMessage: "Louer ou s'abonner",
          bgClass: "!bg-blue-500/80 !border-2 !border-white hover:!bg-white hover:!border-blue-500 hover:[&_svg]:!text-blue-500 hover:[&_svg]:!fill-blue-500"
        }
      default: // loading
        return {
          ariaLabel: "Chargement...",
          iconClass: "!text-white/70 !fill-white/70",
          tooltipMessage: "Chargement...",
          bgClass: "!bg-black/20 !border !border-white/20 hover:[&_svg]:!text-white hover:[&_svg]:!fill-white"
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

  const { ariaLabel, iconClass, tooltipMessage, bgClass } = getButtonProps()
  const isActionLoading = action === 'loading'

  const buttonContent = (
    <button
      onClick={handleButtonClick}
      disabled={disabled || isActionLoading || isUnavailable}
      className={cn(
        "play-button absolute top-2 left-2 z-10",
        "size-9", // Équivalent de size="icon"
        "inline-flex items-center justify-center",
        bgClass,
        "backdrop-blur-sm",
        !isUnavailable && action !== 'payment' && action !== 'play' && "hover:bg-black/40",
        "rounded-full",
        "overflow-hidden",
        // Force invisible state initially, only show on group hover
        "invisible opacity-0",
        "group-hover:visible group-hover:opacity-100",
        "transition-all duration-200 ease-out",
        !isUnavailable && HOVER_SCALE_CLASSES.SUBTLE,
        FOCUS_CLASSES.DEFAULT,
        isActionLoading && "animate-pulse",
        isUnavailable && "cursor-not-allowed opacity-60",
        className
      )}
      aria-label={ariaLabel}
    >
      <Play
        size={ICON_SIZES.COMPACT}
        className={cn(
          "transition-all duration-200",
          iconClass,
          isActionLoading && "animate-spin"
        )}
      />
      {isUnavailable && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-0.5 bg-white rotate-[-45deg]" />
        </div>
      )}
    </button>
  )

  return (
    <>
      {buttonContent}

      {/* Modale de choix de paiement */}
      <PaymentChoiceModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        movieId={movieId}
      />
    </>
  )
}
