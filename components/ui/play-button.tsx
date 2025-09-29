"use client"

import { Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useHydration } from "@/hooks"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { useMovieRental } from "@/hooks/useMovieRental"
import { PaymentChoiceModal } from "@/components/ui/payment-choice-modal"
import { ICON_SIZES, TRANSITION_CLASSES, HOVER_SCALE_CLASSES, FOCUS_CLASSES } from "@/constants"

interface PlayButtonProps {
  movieId: string
  className?: string
  disabled?: boolean
}

export function PlayButtonCompact({ movieId, className, disabled = false }: PlayButtonProps) {
  const router = useRouter()
  const { isHydrated } = useHydration()
  const { user } = useAuth()
  const { hasActiveSubscription, loadingUserSubscription } = useSubscription(user)
  const { isCurrentlyRented, loading: loadingRental, error: rentalError, unknownStatus } = useMovieRental(movieId)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [fallbackMode, setFallbackMode] = useState(false)

  // Fallback après 6 secondes si le chargement ne se termine pas
  useEffect(() => {
    if (loadingRental && !fallbackMode) {
      const timer = setTimeout(() => {
        console.warn('PlayButton: Activating fallback mode after timeout')
        setFallbackMode(true)
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [loadingRental, fallbackMode])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // En mode fallback ou si erreur de chargement, ne pas bloquer l'interaction
    const effectiveLoading = loadingRental && !fallbackMode && !rentalError

    if (disabled || loadingUserSubscription || effectiveLoading) return

    // 1. User non-connecté → Login
    if (!user) {
      router.push('/auth/login')
      return
    }

    // 2. User abonné → Player direct
    if (hasActiveSubscription) {
      router.push(`/movie-player/${movieId}`)
      return
    }

    // 3. User avec film déjà loué → Player direct
    if (isCurrentlyRented) {
      router.push(`/movie-player/${movieId}`)
      return
    }

    // 4. Si le statut de location est inconnu → Tenter le player (l'utilisateur aura peut-être loué)
    if (unknownStatus) {
      console.log('Statut de location inconnu, tentative d\'accès au player pour:', movieId)
      router.push(`/movie-player/${movieId}`)
      return
    }

    // 5. User non-abonné sans location confirmée → Modale de paiement
    setShowPaymentModal(true)
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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled || loadingUserSubscription || (loadingRental && !fallbackMode && !rentalError)}
        className={cn(
          "play-button absolute top-2 left-2 z-10",
          "bg-black/20 backdrop-blur-sm hover:bg-black/40",
          "border border-white/20 hover:border-white hover:border-2",
          "rounded-full",
          // Force invisible state initially, only show on group hover
          "invisible opacity-0",
          "group-hover:visible group-hover:opacity-100",
          "transition-all duration-200 ease-out", // Transition simple et rapide
          HOVER_SCALE_CLASSES.SUBTLE,
          FOCUS_CLASSES.DEFAULT,
          (loadingUserSubscription || (loadingRental && !fallbackMode && !rentalError)) && "animate-pulse",
          className
        )}
        aria-label={
          loadingUserSubscription ? "Vérification de l'abonnement..." :
          (loadingRental && !fallbackMode && !rentalError) ? "Vérification de la location..." :
          unknownStatus ? "Statut inconnu - Tenter d'accéder au film" :
          "Regarder le film"
        }
      >
        <Play
          size={ICON_SIZES.COMPACT}
          className={cn(
            TRANSITION_CLASSES.DEFAULT,
            "text-white/70 hover:text-white fill-white/70 hover:fill-white",
            (loadingUserSubscription || (loadingRental && !fallbackMode && !rentalError)) && "animate-spin"
          )}
        />
      </Button>

      {/* Modale de choix de paiement */}
      <PaymentChoiceModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        movieId={movieId}
      />
    </>
  )
}