import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/movie-rental-status/[id]
 * UPDATED: Vérifie si l'utilisateur authentifié possède un film spécifique
 * Migré du système de location (emprunts) vers le système de propriété (films_registry)
 * Utilisé par le polling après paiement Stripe pour détecter quand le film est ajouté à la collection
 * Note: Le nom "rental-status" est conservé pour compatibilité, mais vérifie maintenant la propriété
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

    // ✅ CORRIGÉ: Vérifier si l'utilisateur a une SESSION ACTIVE pour ce film
    // (utilisé par le polling après paiement pour détecter quand la session est créée)
    const { data: session, error: sessionError } = await supabase
      .from("viewing_sessions")
      .select("id, return_date, statut")
      .eq("user_id", user.id)
      .eq("movie_id", movieId)
      .eq("statut", "en_cours")
      .gt("return_date", new Date().toISOString())
      .maybeSingle()

    if (sessionError) {
      console.error("[movie-rental-status] Error checking session:", sessionError)
      return NextResponse.json(
        { error: "Erreur lors de la vérification de la session" },
        { status: 500 }
      )
    }

    // Retourner le statut de session (format compatible avec l'ancien système)
    return NextResponse.json({
      isCurrentlyRented: !!session, // TRUE si session active existe
      rentalId: session?.id || null, // ID de la session
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
