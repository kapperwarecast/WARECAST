"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, CreditCard, Lock, AlertCircle, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { getStripe, resetStripe } from "@/lib/stripe"
import { Stripe } from "@stripe/stripe-js"
import { useAuth } from "@/contexts/auth-context"

interface MovieData {
  id: string
  titre_francais: string
  titre_original: string
  year: number
  poster_path: string
}

function PaymentForm({
  movieData,
  rentalPrice,
  onPaymentSuccess
}: {
  movieData: MovieData
  rentalPrice: number
  onPaymentSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const movieTitle = movieData.titre_francais || movieData.titre_original

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Créer le Payment Intent côté serveur
      const response = await fetch(`/api/movies/${movieData.id}/create-stripe-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(rentalPrice * 100), // Convertir en centimes
          currency: 'eur',
          movie_title: movieTitle
        })
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
        return
      }

      // Confirmer le paiement
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        setError("Erreur: élément de carte non trouvé")
        return
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(result.client_secret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (confirmError) {
        setError(confirmError.message || "Erreur lors du paiement")
      } else if (paymentIntent?.status === 'succeeded') {
        onPaymentSuccess()
      }
    } catch (error) {
      console.error("Erreur paiement:", error)
      setError("Erreur technique lors du paiement")
    } finally {
      setIsLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="card-element">Informations de carte</Label>
        <div className="p-4 border rounded-lg bg-background shadow-sm">
          <CardElement
            id="card-element"
            options={cardElementOptions}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
          <span className="font-medium">Total à payer</span>
          <span className="text-2xl font-bold">{rentalPrice}€</span>
        </div>

        <Button
          type="submit"
          disabled={!stripe || isLoading}
          className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
          size="lg"
        >
          <Lock className="w-5 h-5 mr-2" />
          {isLoading ? "Traitement en cours..." : `Payer ${rentalPrice}€`}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" />
        Paiement sécurisé par Stripe
      </div>
    </form>
  )
}

function StripeErrorFallback({
  error,
  onRetry
}: {
  error: string
  onRetry: () => void
}) {
  return (
    <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-destructive" />
        <h3 className="font-semibold text-destructive">Erreur de paiement</h3>
      </div>
      <p className="text-destructive mb-4">{error}</p>
      <Button
        onClick={onRetry}
        variant="outline"
        className="w-full"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Réessayer
      </Button>
    </div>
  )
}

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const movieId = params.movieId as string

  const [movieData, setMovieData] = useState<MovieData | null>(null)
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const [isLoadingStripe, setIsLoadingStripe] = useState(true)
  const [isLoadingMovie, setIsLoadingMovie] = useState(true)
  const [movieError, setMovieError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')

  const rentalPrice = 1.50

  // Rediriger si pas connecté
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  // Charger les données du film
  useEffect(() => {
    const loadMovieData = async () => {
      try {
        setIsLoadingMovie(true)
        const response = await fetch(`/api/movies/${movieId}`)

        if (!response.ok) {
          throw new Error("Film non trouvé")
        }

        const data = await response.json()
        setMovieData(data)
      } catch (error) {
        console.error("Erreur chargement film:", error)
        setMovieError(error instanceof Error ? error.message : "Erreur inconnue")
      } finally {
        setIsLoadingMovie(false)
      }
    }

    if (movieId) {
      loadMovieData()
    }
  }, [movieId])

  // Charger Stripe
  const loadStripeInstance = async (retry = false) => {
    try {
      setIsLoadingStripe(true)
      setStripeError(null)

      if (retry) {
        resetStripe()
      }

      const stripeInstance = await getStripe()
      setStripe(stripeInstance)
    } catch (error) {
      console.error("Erreur chargement Stripe:", error)
      setStripeError(error instanceof Error ? error.message : "Erreur inconnue")
    } finally {
      setIsLoadingStripe(false)
    }
  }

  useEffect(() => {
    loadStripeInstance()
  }, [])

  const handlePaymentSuccess = async () => {
    setIsProcessing(true)
    setProcessingMessage("Paiement confirmé !")

    // Polling pour vérifier la création de l'emprunt par le webhook
    const maxAttempts = 30 // 15 secondes (30 × 500ms)
    let attempts = 0

    while (attempts < maxAttempts) {
      attempts++

      try {
        const response = await fetch(`/api/movie-rental-status/${movieId}`)

        if (response.ok) {
          const data = await response.json()

          if (data.isCurrentlyRented) {
            // Emprunt créé avec succès !
            setProcessingMessage("Location confirmée ! Redirection...")
            await new Promise(r => setTimeout(r, 500))
            router.push(`/movie-player/${movieId}`)
            return
          }
        }
      } catch (err) {
        console.error('Erreur vérification emprunt:', err)
      }

      // Mise à jour du message de progression
      if (attempts === 10) {
        setProcessingMessage("Finalisation en cours...")
      } else if (attempts === 20) {
        setProcessingMessage("Encore quelques instants...")
      }

      // Attendre 500ms avant le prochain essai
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Timeout atteint - Afficher une erreur mais donner une option
    setIsProcessing(false)
    setProcessingMessage('')
    alert("La location prend plus de temps que prévu. Veuillez vérifier vos locations dans votre espace personnel ou recharger la page dans quelques instants.")
    router.push('/')
  }

  const handleBack = () => {
    router.back()
  }

  // États de chargement
  if (isLoadingMovie || !movieData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Erreur de chargement du film
  if (movieError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Erreur</h1>
          <p className="text-muted-foreground mb-4">{movieError}</p>
          <Button onClick={() => router.push('/')}>
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    )
  }

  const movieTitle = movieData.titre_francais || movieData.titre_original

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-3 min-w-0">
            <CreditCard className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="font-semibold truncate">Paiement sécurisé</h1>
              <p className="text-sm text-muted-foreground truncate">
                Location de &ldquo;{movieTitle}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Informations du film */}
        <div className="mb-8 p-6 bg-muted/30 rounded-lg border">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">{movieTitle}</h2>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Location 48h</span>
              <span>•</span>
              <span className="font-semibold text-foreground">{rentalPrice}€</span>
            </div>
          </div>
        </div>

        {/* Formulaire de paiement */}
        {isLoadingStripe ? (
          <div className="text-center p-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement du système de paiement...</p>
          </div>
        ) : stripeError || !stripe ? (
          <StripeErrorFallback
            error={stripeError || "Impossible de charger Stripe"}
            onRetry={() => loadStripeInstance(true)}
          />
        ) : (
          <Elements stripe={stripe}>
            <PaymentForm
              movieData={movieData}
              rentalPrice={rentalPrice}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </Elements>
        )}

        {/* Bouton d'annulation */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
          >
            Annuler et retourner
          </Button>
        </div>
      </div>

      {/* Overlay de finalisation de paiement */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-background p-8 rounded-lg max-w-md mx-4 border shadow-2xl">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-center text-xl font-semibold mb-2">{processingMessage}</p>
            <p className="text-center text-sm text-muted-foreground">
              Veuillez patienter pendant que nous finalisons votre location...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}