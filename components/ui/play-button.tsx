"use client"

import { Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useHydration } from "@/hooks"
import { useAuth } from "@/contexts/auth-context"
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
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [movieTitle, setMovieTitle] = useState("")
  const [rentalPrice, setRentalPrice] = useState(1.50)

  const handleClick = async (e: React.MouseEvent) => {
    console.log("PlayButton clicked")
    e.preventDefault()
    e.stopPropagation()

    if (disabled || isLoading) return

    // Si utilisateur pas connecté, rediriger vers login
    if (!user) {
      console.log("User not logged in, redirecting to login")
      router.push('/auth/login')
      return
    }

    try {
      setIsLoading(true)
      console.log("Calling rent API for movie:", movieId)

      // Appeler l'API d'emprunt
      const response = await fetch(`/api/movies/${movieId}/rent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      console.log("API response:", result)

      if (result.success) {
        // Succès : gérer les différents cas d'emprunt unique
        if (result.existing_rental) {
          console.log("Accès autorisé - emprunt existant:", result.emprunt_id)
        } else if (result.previous_rental_released) {
          console.log("Film précédent libéré, nouveau film emprunté:", result.emprunt_id)
        } else {
          console.log("Premier emprunt créé:", result.emprunt_id)
        }
        // Dans tous les cas, rediriger vers le player
        console.log("Redirecting to player")
        router.push(`/movie-player/${movieId}`)
      } else if (result.requires_payment_choice) {
        // Utilisateur sans abonnement → afficher la modale de choix
        console.log("Showing payment modal")
        setMovieTitle(result.movie_title)
        setRentalPrice(result.rental_price)
        setShowPaymentModal(true)
      } else {
        // Autres erreurs
        console.error("Erreur emprunt:", result.error)
        alert(result.error || "Impossible d'emprunter ce film")
      }
    } catch (error) {
      console.error("Erreur réseau:", error)
      alert("Erreur de connexion. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          "play-button absolute top-2 left-2 z-10",
          "bg-black/20 backdrop-blur-sm hover:bg-black/40",
          "border border-white/10",
          "rounded-full",
          // Force invisible state initially, only show on group hover
          "invisible opacity-0",
          "group-hover:visible group-hover:opacity-100",
          TRANSITION_CLASSES.SMOOTH,
          HOVER_SCALE_CLASSES.SUBTLE,
          FOCUS_CLASSES.DEFAULT,
          isLoading && "animate-pulse",
          className
        )}
        aria-label={isLoading ? "Emprunt en cours..." : "Regarder le film"}
      >
        <Play
          size={ICON_SIZES.COMPACT}
          className={cn(
            TRANSITION_CLASSES.DEFAULT,
            "text-white/70 hover:text-white fill-white/70 hover:fill-white",
            isLoading && "animate-spin"
          )}
        />
      </Button>

      {/* Modale de choix de paiement */}
      <PaymentChoiceModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        movieTitle={movieTitle}
        movieId={movieId}
        rentalPrice={rentalPrice}
      />
    </>
  )
}