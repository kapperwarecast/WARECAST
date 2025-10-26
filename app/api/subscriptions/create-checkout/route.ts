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
    const body = await request.json()
    const { abonnement_id } = body

    if (!abonnement_id) {
      return NextResponse.json({
        error: "L'ID de l'abonnement est requis"
      }, { status: 400 })
    }

    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({
        error: "Vous devez être connecté pour souscrire à un abonnement"
      }, { status: 401 })
    }

    // Récupérer les détails de l'abonnement
    const { data: abonnement, error: abonnementError } = await supabase
      .from('abonnements')
      .select('*')
      .eq('id', abonnement_id)
      .single()

    if (abonnementError || !abonnement) {
      return NextResponse.json({
        error: "Abonnement non trouvé"
      }, { status: 404 })
    }

    // Vérifier que le stripe_price_id existe
    if (!abonnement.stripe_price_id) {
      return NextResponse.json({
        error: "Cet abonnement n'a pas de prix Stripe configuré"
      }, { status: 400 })
    }

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error("Erreur récupération profil:", profileError)
    }

    try {
      const stripe = getStripe()

      let customerId = profile?.stripe_customer_id

      // Créer un nouveau customer Stripe si nécessaire
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id
          }
        })
        customerId = customer.id

        // Sauvegarder le customer_id dans notre base
        await supabase
          .from('user_profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      }

      // Créer la Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: abonnement.stripe_price_id,
            quantity: 1
          }
        ],
        success_url: `${request.headers.get('origin')}/formules/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${request.headers.get('origin')}/formules/cancel`,
        metadata: {
          user_id: user.id,
          abonnement_id: abonnement_id
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
            abonnement_id: abonnement_id
          }
        }
      })

      return NextResponse.json({
        sessionId: session.id,
        url: session.url
      })

    } catch (stripeError) {
      console.error("Erreur Stripe:", stripeError)
      return NextResponse.json({
        error: "Erreur lors de la création de la session de paiement"
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Erreur API create-checkout:", error)
    return NextResponse.json({
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}
