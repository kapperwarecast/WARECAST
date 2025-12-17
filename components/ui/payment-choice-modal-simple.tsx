"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard, Star, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMovieInfo } from "@/hooks/actions"
import { useEffect, useRef } from "react"

interface PaymentChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  movieId: string
}

export function PaymentChoiceModalSimple({
  isOpen,
  onClose,
  movieId
}: PaymentChoiceModalProps) {
  const router = useRouter()
  const { movieInfo, loading } = useMovieInfo(movieId)
  const isClosingRef = useRef(false)

  const handleSubscribe = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isClosingRef.current = true
    onClose()
    // Délai pour s'assurer que la modal est fermée avant navigation
    setTimeout(() => {
      router.push('/formules')
      isClosingRef.current = false
    }, 100)
  }

  const handlePayWithStripe = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isClosingRef.current = true
    onClose()
    // Délai pour s'assurer que la modal est fermée avant navigation
    setTimeout(() => {
      router.push(`/payment/${movieId}`)
      isClosingRef.current = false
    }, 100)
  }

  // Bloquer temporairement la navigation pendant la fermeture
  useEffect(() => {
    if (!isOpen) return

    const handleClick = (e: Event) => {
      // Si on est en train de fermer, bloquer tous les clics
      if (isClosingRef.current) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      // Si le clic vient de l'extérieur de la modal
      const target = e.target as Element
      const isInModal = target.closest('[data-radix-dialog-content]')
      
      if (!isInModal) {
        e.preventDefault()
        e.stopPropagation()
        isClosingRef.current = true
        onClose()
        
        // Réinitialiser après un délai
        setTimeout(() => {
          isClosingRef.current = false
        }, 200)
        
        return false
      }
    }

    // Capturer les clics pendant la phase de capture
    document.addEventListener('click', handleClick, true)
    document.addEventListener('touchstart', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('touchstart', handleClick, true)
      isClosingRef.current = false
    }
  }, [isOpen, onClose])

  // Gestionnaire pour les clics extérieurs - simple et efficace
  const handleOpenChange = (open: boolean) => {
    if (!open && !isClosingRef.current) {
      isClosingRef.current = true
      onClose()
      setTimeout(() => {
        isClosingRef.current = false
      }, 200)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => {
          e.preventDefault()
          if (!isClosingRef.current) {
            isClosingRef.current = true
            onClose()
            setTimeout(() => {
              isClosingRef.current = false
            }, 200)
          }
        }}
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          if (!isClosingRef.current) {
            isClosingRef.current = true
            onClose()
            setTimeout(() => {
              isClosingRef.current = false
            }, 200)
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Choisissez votre option</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Pour regarder <strong>&ldquo;{movieInfo?.titre_francais || movieInfo?.titre_original || "Film"}&rdquo;</strong>, vous avez 2 options :
              </p>

              <div className="grid gap-4">
                {/* Option 1: Paiement unitaire - UI améliorée */}
                <Button
                  onClick={handlePayWithStripe}
                  className="p-4 min-h-[80px] flex items-center justify-between cursor-pointer
                             hover:scale-[1.02] hover:shadow-xl transition-all duration-300
                             bg-gradient-to-r from-blue-600 to-blue-700
                             hover:from-blue-700 hover:to-blue-800
                             border-0 shadow-lg hover:shadow-blue-500/25 w-full"
                  variant="default"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-bold text-base text-white truncate">Échange 48h</div>
                      <div className="text-xs text-blue-100 leading-tight">Accès immédiat pendant 48 heures</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-white bg-white/10 px-3 py-1 rounded-lg flex-shrink-0 ml-2">
                    1.50€
                  </div>
                </Button>

                {/* Option 2: Abonnement - UI améliorée */}
                <Button
                  onClick={handleSubscribe}
                  variant="outline"
                  className="p-4 min-h-[80px] flex items-center justify-between cursor-pointer
                             border-2 border-primary/30 hover:border-primary/60
                             hover:scale-[1.02] hover:shadow-lg hover:bg-primary/5
                             transition-all duration-300 group w-full"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <Star className="h-5 w-5 text-primary fill-primary/20" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-bold text-base text-primary truncate">Abonnement Premium</div>
                      <div className="text-xs text-muted-foreground leading-tight">Films illimités • Annulation libre</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-lg font-bold text-primary">5€</div>
                    <div className="text-xs text-muted-foreground">/mois</div>
                  </div>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2">
                Vous pouvez annuler votre abonnement à tout moment
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
