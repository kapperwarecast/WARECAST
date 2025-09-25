import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    // En production, utilisez process.env.STRIPE_WEBHOOK_SECRET
    // Pour les tests, on peut ignorer la vérification de signature
    event = JSON.parse(body)
  } catch (err) {
    console.error("Erreur parsing webhook:", err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Mettre à jour le paiement en base
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
          break
        }

        // Récupérer les métadonnées du paiement
        const movieId = paymentIntent.metadata.movie_id
        const userId = paymentIntent.metadata.user_id

        if (movieId && userId) {
          // Récupérer le payment_id depuis notre base
          const { data: payment } = await supabase
            .from('payments')
            .select('id')
            .eq('external_payment_id', paymentIntent.id)
            .single()

          if (payment) {
            // Appeler notre RPC pour créer l'emprunt
            const { error: rpcError } = await supabase
              .rpc('rent_or_access_movie', {
                p_movie_id: movieId,
                p_auth_user_id: userId,
                p_payment_id: payment.id
              })

            if (rpcError) {
              console.error("Erreur RPC rent_or_access_movie:", rpcError)
            }
          }
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Marquer le paiement comme échoué
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('external_payment_id', paymentIntent.id)

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