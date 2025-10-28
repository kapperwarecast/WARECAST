import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/movies/[id]/rent
 * Point d'entrée pour location via abonnement
 * Utilise la RPC rent_or_access_movie pour garantir validation atomique
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: movieId } = await params

    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: "Vous devez être connecté pour emprunter un film"
      }, { status: 401 })
    }

    // Utiliser la RPC qui fait TOUTE la validation (copies, abonnement, rotation)
    const { data, error: rpcError } = await supabase.rpc('rent_or_access_movie', {
      p_movie_id: movieId,
      p_auth_user_id: user.id,
      p_payment_id: null
    })

    if (rpcError) {
      console.error("Erreur RPC rent_or_access_movie:", rpcError)
      return NextResponse.json({
        success: false,
        error: "Erreur technique lors de la location"
      }, { status: 500 })
    }

    // Vérifier le résultat de la RPC
    if (!data || !data.success) {
      const errorMsg = data?.error || 'Erreur inconnue'

      // Cas spéciaux basés sur l'erreur
      if (errorMsg.includes('copie') || errorMsg.includes('disponible')) {
        return NextResponse.json({
          success: false,
          error: 'Aucune copie disponible pour ce film'
        }, { status: 409 }) // 409 Conflict
      }

      if (errorMsg.includes('payment') || data?.requires_payment_choice) {
        // Utilisateur sans abonnement → modal de choix
        return NextResponse.json({
          success: false,
          requires_payment_choice: true,
          movie_title: data.movie_title || "Film",
          rental_price: 1.50
        }, { status: 409 })
      }

      return NextResponse.json({
        success: false,
        error: errorMsg
      }, { status: 500 })
    }

    // Succès - emprunt créé ou existant
    return NextResponse.json({
      success: true,
      existing_rental: data.existing_rental || false,
      emprunt_id: data.emprunt_id,
      subscription_access: data.rental_type === 'subscription',
      previous_rental_released: data.previous_rental_released || false,
      movie_title: data.movie_title,
      expires_at: data.expires_at
    })

  } catch (error) {
    console.error("Erreur API rent:", error)
    return NextResponse.json({
      success: false,
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}
