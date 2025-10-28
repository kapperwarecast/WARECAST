import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/movie-rental-status/[id]
 * Vérifie si l'utilisateur authentifié a un emprunt actif pour un film spécifique
 * Utilisé par le polling après paiement Stripe pour détecter quand l'emprunt est créé par le webhook
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: movieId } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    // Vérifier si l'utilisateur a un emprunt actif pour ce film
    const { data: rental, error: rentalError } = await supabase
      .from("emprunts")
      .select("id, date_retour")
      .eq("user_id", user.id)
      .eq("movie_id", movieId)
      .eq("statut", "en_cours")
      .maybeSingle()

    if (rentalError) {
      console.error("[movie-rental-status] Error checking rental:", rentalError)
      return NextResponse.json(
        { error: "Erreur lors de la vérification de la location" },
        { status: 500 }
      )
    }

    // Retourner le statut de location
    return NextResponse.json({
      isCurrentlyRented: !!rental,
      rentalId: rental?.id || null,
      movieId: movieId,
    })
  } catch (error) {
    console.error("[movie-rental-status] Unexpected error:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
