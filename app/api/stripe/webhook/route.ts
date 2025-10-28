import { createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Fonction pour obtenir l'instance Stripe (évite l'initialisation au build)
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquante")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event: Stripe.Event

  // Vérifier la signature Stripe pour sécuriser le webhook
  if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
    try {
      const stripe = getStripe()
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error("Erreur vérification signature Stripe:", err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  } else {
    // Fallback pour développement (sans vérification de signature)
    try {
      event = JSON.parse(body)
      console.warn("⚠️ Webhook sans vérification de signature (dev only)")
    } catch (err) {
      console.error("Erreur parsing webhook:", err)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
  }

  // Utiliser le service role key pour bypass RLS (pas d'await car createAdminClient est synchrone)
  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Mettre à jour le statut du paiement
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('external_payment_id', paymentIntent.id)

        if (updateError) {
          console.error("Erreur mise à jour payment:", updateError)
          return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
        }

        // Récupérer les métadonnées du paiement
        const movieId = paymentIntent.metadata.movie_id
        const userId = paymentIntent.metadata.user_id

        if (movieId && userId) {
          // Récupérer le payment_id depuis notre base avec retry logic (race condition)
          let payment = null
          let paymentFetchError = null

          // Retry jusqu'à 5 fois avec délai de 1s (max 5s d'attente)
          for (let attempt = 0; attempt < 5; attempt++) {
            const { data, error } = await supabase
              .from('payments')
              .select('id')
              .eq('external_payment_id', paymentIntent.id)
              .maybeSingle()

            if (data) {
              payment = data
              break
            }

            if (attempt < 4) {
              // Attendre 1s avant retry (sauf dernier essai)
              await new Promise(resolve => setTimeout(resolve, 1000))
            } else {
              paymentFetchError = error
            }
          }

          // Si toujours pas trouvé après 5 essais
          if (!payment) {
            console.error("Payment not found after retries:", {
              external_payment_id: paymentIntent.id,
              error: paymentFetchError
            })
            // Retourner 409 (Conflict) pour que Stripe retry
            return NextResponse.json({
              error: 'Payment not ready yet',
              details: `Payment Intent ${paymentIntent.id} not found in database after 5s. Stripe will retry.`,
              retry: true
            }, { status: 409 })
          }

          // Appeler notre RPC pour créer l'emprunt
          const { data: result, error: rpcError } = await supabase
            .rpc('rent_or_access_movie', {
              p_movie_id: movieId,
              p_auth_user_id: userId,
              p_payment_id: payment.id
            })

          if (rpcError) {
            console.error("Erreur RPC rent_or_access_movie:", rpcError)
            return NextResponse.json({ error: 'Failed to create rental' }, { status: 500 })
          }

          console.log('Payment intent succeeded and rental created:', result)
        } else {
          console.error("Missing movieId or userId in payment metadata")
          return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 500 })
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Marquer le paiement comme échoué
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('external_payment_id', paymentIntent.id)

        if (updateError) {
          console.error("Erreur mise à jour payment failed:", updateError)
        }

        console.log('Payment intent failed:', paymentIntent.id)

        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const userId = session.metadata?.user_id
          const abonnementId = session.metadata?.abonnement_id

          if (userId && abonnementId) {
            // Calculer la date d'expiration (1 mois)
            const dateExpiration = new Date()
            dateExpiration.setMonth(dateExpiration.getMonth() + 1)

            // Créer l'abonnement dans user_abonnements
            const { error: subscriptionError } = await supabase
              .from('user_abonnements')
              .insert({
                user_id: userId,
                abonnement_id: abonnementId,
                stripe_subscription_id: session.subscription as string,
                statut: 'actif',
                date_souscription: new Date().toISOString(),
                date_expiration: dateExpiration.toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (subscriptionError) {
              console.error("Erreur création abonnement:", subscriptionError)
              return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
            }

            // Enregistrer le paiement initial
            const { error: paymentError } = await supabase.from('payments').insert({
              user_id: userId,
              payment_type: 'subscription',
              amount: (session.amount_total || 0) / 100,
              currency: session.currency || 'eur',
              status: 'completed',
              external_payment_id: session.payment_intent as string,
              subscription_id: session.subscription as string,
              completed_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            })

            if (paymentError) {
              console.error("Erreur enregistrement paiement abonnement:", paymentError)
            }

            console.log('Subscription created successfully for user:', userId)
          } else {
            console.error("Missing userId or abonnementId in session metadata")
            return NextResponse.json({ error: 'Invalid session metadata' }, { status: 500 })
          }
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Mapper le statut Stripe vers notre statut
        const statut = subscription.status === 'active' ? 'actif' :
                       subscription.status === 'canceled' ? 'suspendu' :
                       subscription.status === 'past_due' ? 'suspendu' : 'suspendu'

        const { error: updateError } = await supabase
          .from('user_abonnements')
          .update({
            statut: statut,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error("Erreur mise à jour abonnement:", updateError)
        }

        console.log('Subscription updated:', subscription.id, 'Status:', statut)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error: deleteError } = await supabase
          .from('user_abonnements')
          .update({
            statut: 'suspendu',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (deleteError) {
          console.error("Erreur suppression abonnement:", deleteError)
        }

        console.log('Subscription deleted:', subscription.id)

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as {subscription?: string | Stripe.Subscription}).subscription

        if (subscriptionId) {
          // Prolonger l'abonnement d'un mois
          const dateExpiration = new Date(invoice.period_end * 1000)

          const { error: renewError } = await supabase
            .from('user_abonnements')
            .update({
              date_expiration: dateExpiration.toISOString(),
              statut: 'actif',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id)

          if (renewError) {
            console.error("Erreur renouvellement abonnement:", renewError)
          }

          // Enregistrer le paiement de renouvellement
          const { data: userAbonnement } = await supabase
            .from('user_abonnements')
            .select('user_id')
            .eq('stripe_subscription_id', typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id)
            .single()

          if (userAbonnement) {
            const paymentIntentId = (invoice as {payment_intent?: string | Stripe.PaymentIntent}).payment_intent
            const { error: paymentError } = await supabase.from('payments').insert({
              user_id: userAbonnement.user_id,
              payment_type: 'subscription',
              amount: (invoice.amount_paid || 0) / 100,
              currency: invoice.currency || 'eur',
              status: 'completed',
              external_payment_id: typeof paymentIntentId === 'string' ? paymentIntentId : paymentIntentId?.id || null,
              subscription_id: typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id,
              completed_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            })

            if (paymentError) {
              console.error("Erreur enregistrement paiement renouvellement:", paymentError)
            }
          }

          console.log('Subscription renewed:', typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as {subscription?: string | Stripe.Subscription}).subscription

        if (subscriptionId) {
          const { error: failError } = await supabase
            .from('user_abonnements')
            .update({
              statut: 'suspendu',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id)

          if (failError) {
            console.error("Erreur suspension abonnement:", failError)
          }

          console.log('Subscription payment failed and suspended:', typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id)
        }

        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Erreur traitement webhook:", error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}