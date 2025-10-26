"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard, Star, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMovieInfo } from "@/hooks/actions"

interface PaymentChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  movieId: string
}

export function PaymentChoiceModal({
  isOpen,
  onClose,
  movieId
}: PaymentChoiceModalProps) {
  const router = useRouter()
  const { movieInfo, loading } = useMovieInfo(movieId)

  const handleSubscribe = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
    router.push('/formules')
  }

  const handlePayWithStripe = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
    router.push(`/payment/${movieId}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                      <div className="font-bold text-base text-white truncate">Location 48h</div>
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