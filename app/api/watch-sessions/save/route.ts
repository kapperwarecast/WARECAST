import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SaveVideoPositionRequest } from "@/types/playback"

/**
 * POST /api/watch-sessions/save
 *
 * Sauvegarde la position de lecture vidéo pour un emprunt actif
 * Permet à l'utilisateur de reprendre où il s'est arrêté
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Non authentifié" },
        { status: 401 }
      )
    }

    // Récupérer les données de la requête
    const body: SaveVideoPositionRequest = await request.json()
    const { movieId, rentalId, position, duration } = body

    // Validation des données
    if (!movieId || !rentalId || typeof position !== 'number' || typeof duration !== 'number') {
      return NextResponse.json(
        { success: false, message: "Données invalides" },
        { status: 400 }
      )
    }

    if (position < 0 || duration <= 0 || position > duration) {
      return NextResponse.json(
        { success: false, message: "Position ou durée invalide" },
        { status: 400 }
      )
    }

    // Vérifier que la session appartient bien à l'utilisateur et est active
    const { data: rental, error: rentalError } = await supabase
      .from("viewing_sessions")
      .select("id, user_id, movie_id, statut")
      .eq("id", rentalId)
      .eq("user_id", user.id)
      .eq("movie_id", movieId)
      .eq("statut", "en_cours")
      .single()

    if (rentalError || !rental) {
      return NextResponse.json(
        { success: false, message: "Session non trouvée ou expirée" },
        { status: 404 }
      )
    }

    // Mettre à jour la position de lecture et le timestamp
    const { error: updateError } = await supabase
      .from("viewing_sessions")
      .update({
        position_seconds: Math.floor(position),
        last_watched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", rentalId)

    if (updateError) {
      console.error("Error updating video position:", updateError)
      return NextResponse.json(
        { success: false, message: "Erreur lors de la sauvegarde" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Position sauvegardée"
    })

  } catch (error) {
    console.error("Error in save watch session:", error)
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}
