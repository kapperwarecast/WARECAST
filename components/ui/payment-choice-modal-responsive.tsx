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

export function PaymentChoiceModalResponsive({
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
      <DialogContent 
        className="sm:max-w-lg w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6" 
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg sm:text-xl">Choisissez votre option</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pour regarder <strong>&ldquo;{movieInfo?.titre_francais || movieInfo?.titre_original || "Film"}&rdquo;</strong>, vous avez 2 options :
              </p>

              <div className="grid gap-3 sm:gap-4">
                {/* Option 1: Paiement unitaire - Layout responsive */}
                <div className="relative overflow-hidden rounded-lg">
                  <Button
                    onClick={handlePayWithStripe}
                    className="w-full p-0 h-auto bg-gradient-to-r from-blue-600 to-blue-700
                               hover:from-blue-700 hover:to-blue-800
                               border-0 shadow-lg hover:shadow-blue-500/25
                               hover:scale-[1.02] transition-all duration-300"
                    variant="default"
                  >
                    <div className="w-full p-4 sm:p-5">
                      {/* Mobile: Layout vertical */}
                      <div className="flex flex-col sm:hidden gap-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CreditCard className="h-5 w-5 text-white" />
                          <span className="font-bold text-lg text-white">Échange 48h</span>
                        </div>
                        <p className="text-sm text-blue-100">Accès immédiat pendant 48 heures</p>
                        <div className="text-2xl font-bold text-white bg-white/20 py-2 px-4 rounded-lg self-center">
                          1.50€
                        </div>
                      </div>
                      
                      {/* Desktop: Layout horizontal */}
                      <div className="hidden sm:flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-lg text-white">Échange 48h</div>
                            <div className="text-sm text-blue-100">Accès immédiat pendant 48 heures</div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-white bg-white/10 px-4 py-2 rounded-lg">
                          1.50€
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>

                {/* Option 2: Abonnement - Layout responsive */}
                <div className="relative overflow-hidden rounded-lg">
                  <Button
                    onClick={handleSubscribe}
                    variant="outline"
                    className="w-full p-0 h-auto border-2 border-primary/30 hover:border-primary/60
                               hover:scale-[1.02] hover:shadow-lg hover:bg-primary/5
                               transition-all duration-300 group"
                  >
                    <div className="w-full p-4 sm:p-5">
                      {/* Mobile: Layout vertical */}
                      <div className="flex flex-col sm:hidden gap-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Star className="h-5 w-5 text-primary fill-primary/20" />
                          <span className="font-bold text-lg text-primary">Abonnement Premium</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Films illimités • Annulation libre</p>
                        <div className="self-center">
                          <div className="text-2xl font-bold text-primary">5€</div>
                          <div className="text-sm text-muted-foreground">/mois</div>
                        </div>
                      </div>
                      
                      {/* Desktop: Layout horizontal */}
                      <div className="hidden sm:flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Star className="h-6 w-6 text-primary fill-primary/20" />
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-lg text-primary">Abonnement Premium</div>
                            <div className="text-sm text-muted-foreground">Films illimités • Annulation libre</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">5€</div>
                          <div className="text-xs text-muted-foreground">/mois</div>
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2 leading-relaxed">
                Vous pouvez annuler votre abonnement à tout moment
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
