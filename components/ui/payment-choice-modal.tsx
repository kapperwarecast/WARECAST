"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard, Star } from "lucide-react"
import { useRouter } from "next/navigation"

interface PaymentChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  movieTitle: string
  movieId: string
  rentalPrice: number
}

export function PaymentChoiceModal({
  isOpen,
  onClose,
  movieTitle,
  movieId,
  rentalPrice
}: PaymentChoiceModalProps) {
  const router = useRouter()

  const handleSubscribe = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
    router.push('/abonnement')
  }

  const handlePayWithStripe = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
    router.push(`/payment/${movieId}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Choisissez votre option</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pour regarder <strong>&ldquo;{movieTitle}&rdquo;</strong>, vous avez 2 options :
          </p>

          <div className="grid gap-4">
            {/* Option 1: Paiement unitaire - UI améliorée */}
            <Button
              onClick={handlePayWithStripe}
              className="p-6 h-auto flex items-center justify-between cursor-pointer
                         hover:scale-[1.02] hover:shadow-xl transition-all duration-300
                         bg-gradient-to-r from-blue-600 to-blue-700
                         hover:from-blue-700 hover:to-blue-800
                         border-0 shadow-lg hover:shadow-blue-500/25"
              variant="default"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg text-white">Location 48h</div>
                  <div className="text-sm text-blue-100">Accès immédiat pendant 48 heures</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-white bg-white/10 px-4 py-2 rounded-lg">
                {rentalPrice}€
              </div>
            </Button>

            {/* Option 2: Abonnement - UI améliorée */}
            <Button
              onClick={handleSubscribe}
              variant="outline"
              className="p-6 h-auto flex items-center justify-between cursor-pointer
                         border-2 border-primary/30 hover:border-primary/60
                         hover:scale-[1.02] hover:shadow-lg hover:bg-primary/5
                         transition-all duration-300 group"
            >
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
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2">
            Vous pouvez annuler votre abonnement à tout moment
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}