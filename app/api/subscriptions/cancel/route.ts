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

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({
        error: "Vous devez être connecté pour annuler un abonnement"
      }, { status: 401 })
    }

    // Récupérer l'abonnement actif de l'utilisateur
    const { data: userAbonnement, error: abonnementError } = await supabase
      .from('user_abonnements')
      .select('id, stripe_subscription_id, statut, date_expiration')
      .eq('user_id', user.id)
      .eq('statut', 'actif')
      .order('date_expiration', { ascending: false })
      .limit(1)
      .single()

    if (abonnementError || !userAbonnement) {
      return NextResponse.json({
        error: "Aucun abonnement actif trouvé"
      }, { status: 404 })
    }

    if (!userAbonnement.stripe_subscription_id) {
      return NextResponse.json({
        error: "Cet abonnement n'est pas lié à Stripe"
      }, { status: 400 })
    }

    try {
      const stripe = getStripe()

      // Annuler l'abonnement à la fin de la période en cours
      // L'utilisateur garde l'accès jusqu'à la date d'expiration
      await stripe.subscriptions.update(
        userAbonnement.stripe_subscription_id,
        {
          cancel_at_period_end: true
        }
      )

      // Mettre à jour le statut dans la base de données
      const { error: updateError } = await supabase
        .from('user_abonnements')
        .update({ statut: 'résilié' })
        .eq('id', userAbonnement.id)

      if (updateError) {
        console.error("Erreur mise à jour statut:", updateError)
      }

      // Formater la date d'expiration
      const expirationDate = new Date(userAbonnement.date_expiration)
      const formattedDate = expirationDate.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      return NextResponse.json({
        success: true,
        message: `Résiliation confirmée. Aucun prélèvement ne sera effectué à partir de la fin de votre période en cours. Vous conservez l'accès à tous vos avantages jusqu'au ${formattedDate}.`
      })

    } catch (stripeError) {
      console.error("Erreur Stripe:", stripeError)
      return NextResponse.json({
        error: "Erreur lors de l'annulation de l'abonnement"
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Erreur API cancel subscription:", error)
    return NextResponse.json({
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}
