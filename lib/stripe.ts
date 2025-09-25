import { loadStripe, Stripe } from "@stripe/stripe-js"

let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      throw new Error("Clé publishable Stripe manquante. Vérifiez votre fichier .env.local")
    }

    try {
      stripePromise = loadStripe(publishableKey)
    } catch (error) {
      console.error("Erreur lors du chargement de Stripe:", error)
      throw new Error("Impossible de charger Stripe. Vérifiez votre connexion internet.")
    }
  }

  return stripePromise
}

// Fonction pour réinitialiser Stripe (utile pour les tests et le retry)
export const resetStripe = () => {
  stripePromise = null
}