import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: paymentId } = await params

    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: "Vous devez être connecté"
      }, { status: 401 })
    }

    // Vérifier que le paiement appartient à l'utilisateur et est en attente
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({
        success: false,
        error: "Paiement non trouvé ou déjà traité"
      }, { status: 404 })
    }

    // Marquer le paiement comme complété
    // En production, ici on vérifierait avec Stripe/PayPal
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        external_payment_id: `mock_${Date.now()}`, // Mock payment ID
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (updateError) {
      console.error("Erreur mise à jour paiement:", updateError)
      return NextResponse.json({
        success: false,
        error: "Erreur lors de la confirmation du paiement"
      }, { status: 500 })
    }

    // Récupérer l'ID du film depuis les métadonnées du paiement
    const movieId = payment.payment_intent_data?.movie_id

    if (!movieId) {
      return NextResponse.json({
        success: false,
        error: "Données de paiement invalides"
      }, { status: 400 })
    }

    // Appeler la fonction RPC pour créer l'emprunt avec le paiement validé
    const { data: result, error: rpcError } = await supabase
      .rpc('rent_or_access_movie', {
        p_movie_id: movieId,
        p_auth_user_id: user.id,
        p_payment_id: paymentId
      })

    if (rpcError) {
      console.error("Erreur RPC rent_or_access_movie:", rpcError)
      return NextResponse.json({
        success: false,
        error: "Erreur lors de la création de l'emprunt"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payment_confirmed: true,
      rental_result: result
    })

  } catch (error) {
    console.error("Erreur API confirm-payment:", error)
    return NextResponse.json({
      success: false,
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}