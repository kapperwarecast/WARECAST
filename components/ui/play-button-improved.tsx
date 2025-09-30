"use client"

import { Play } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useHydration } from "@/hooks"
import { usePlayButton } from "@/hooks/usePlayButton"
import { useMovieRentalStore } from "@/stores/rental-store"
import { useRealtimeUserRental } from "@/hooks/useRealtimeUserRental"
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

  // Utiliser Realtime pour les emprunts (instantané) avec fallback sur le store
  const { isCurrentlyRented: realtimeRented } = useRealtimeUserRental(movieId)
  const { isCurrentlyRented: storeRented, loading } = useMovieRentalStore(movieId)

  // Priorité à Realtime si disponible (non-null), sinon fallback sur store
  const isCurrentlyRented = realtimeRented !== null ? realtimeRented : storeRented

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
        const playLabel = hasActiveSubscription
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
  const isLoading = action === 'loading'

  const buttonContent = (
    <button
      onClick={handleButtonClick}
      disabled={disabled || isLoading || isUnavailable}
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
        isLoading && "animate-pulse",
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
          isLoading && "animate-spin"
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
