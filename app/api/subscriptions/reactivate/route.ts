import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Fonction pour obtenir l'instance Stripe
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquante")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({
        error: "Vous devez être connecté pour réactiver un abonnement"
      }, { status: 401 })
    }

    // Récupérer l'abonnement résilié de l'utilisateur
    const { data: userAbonnement, error: abonnementError } = await supabase
      .from('user_abonnements')
      .select('id, stripe_subscription_id, statut, date_expiration')
      .eq('user_id', user.id)
      .eq('statut', 'résilié')
      .order('date_expiration', { ascending: false })
      .limit(1)
      .single()

    if (abonnementError || !userAbonnement) {
      return NextResponse.json({
        error: "Aucun abonnement résilié trouvé"
      }, { status: 404 })
    }

    if (!userAbonnement.stripe_subscription_id) {
      return NextResponse.json({
        error: "Cet abonnement n'est pas lié à Stripe"
      }, { status: 400 })
    }

    try {
      const stripe = getStripe()

      // Réactiver l'abonnement (annuler la résiliation programmée)
      await stripe.subscriptions.update(
        userAbonnement.stripe_subscription_id,
        {
          cancel_at_period_end: false
        }
      )

      // Mettre à jour le statut dans la base de données
      const { error: updateError } = await supabase
        .from('user_abonnements')
        .update({ statut: 'actif' })
        .eq('id', userAbonnement.id)

      if (updateError) {
        console.error("Erreur mise à jour statut:", updateError)
        return NextResponse.json({
          error: "Erreur lors de la mise à jour de l'abonnement"
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Votre abonnement a été réactivé avec succès. Le renouvellement automatique est rétabli."
      })

    } catch (stripeError) {
      console.error("Erreur Stripe:", stripeError)
      return NextResponse.json({
        error: "Erreur lors de la réactivation de l'abonnement"
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Erreur API reactivate subscription:", error)
    return NextResponse.json({
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}
