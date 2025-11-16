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

    // Vérifier si l'utilisateur possède ce film dans films_registry
    // Type cast needed: films_registry table exists in DB but not in generated types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ownership, error: ownershipError } = await supabase
      .from("films_registry" as any)
      .select("id, acquisition_date")
      .eq("current_owner_id", user.id)
      .eq("movie_id", movieId)
      .maybeSingle()

    if (ownershipError) {
      console.error("[movie-rental-status] Error checking ownership:", ownershipError)
      return NextResponse.json(
        { error: "Erreur lors de la vérification de la propriété" },
        { status: 500 }
      )
    }

    // Retourner le statut de propriété (format compatible avec l'ancien système)
    return NextResponse.json({
      isCurrentlyRented: !!ownership, // Conservé pour compatibilité - signifie "isOwned" maintenant
      rentalId: ownership?.id || null, // ID de l'entrée dans films_registry
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
