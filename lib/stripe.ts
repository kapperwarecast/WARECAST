import { loadStripe, Stripe as StripeClient } from "@stripe/stripe-js"
import Stripe from "stripe"

let stripePromise: Promise<StripeClient | null> | null = null

export const getStripe = async (): Promise<StripeClient | null> => {
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

// Server-side Stripe instance (for API routes only)
export function getServerStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquante")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  })
}