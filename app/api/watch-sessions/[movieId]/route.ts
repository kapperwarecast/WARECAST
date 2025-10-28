import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { VideoResumeResponse, VideoResumeData } from "@/types/playback"

/**
 * GET /api/watch-sessions/[movieId]
 *
 * Récupère la dernière position de lecture pour un film
 * Retourne null si :
 * - Aucun emprunt actif
 * - Position à 0
 * - Dernière lecture > 30 jours
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const { movieId } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<VideoResumeResponse>(
        { success: false, data: null, message: "Non authentifié" },
        { status: 401 }
      )
    }

    // Récupérer l'emprunt actif avec position de lecture
    const { data: rental, error: rentalError } = await supabase
      .from("emprunts")
      .select(`
        id,
        user_id,
        movie_id,
        statut,
        position_seconds,
        last_watched_at,
        movies (
          duree
        )
      `)
      .eq("user_id", user.id)
      .eq("movie_id", movieId)
      .eq("statut", "en_cours")
      .single()

    // Pas d'emprunt actif
    if (rentalError || !rental) {
      return NextResponse.json<VideoResumeResponse>({
        success: true,
        data: null,
        message: "Aucun emprunt actif"
      }, {
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    // Vérifier si une position existe
    const position = rental.position_seconds || 0
    if (position === 0) {
      return NextResponse.json<VideoResumeResponse>({
        success: true,
        data: null,
        message: "Aucune position de lecture"
      }, {
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    // Vérifier l'expiration (30 jours)
    if (rental.last_watched_at) {
      const lastWatched = new Date(rental.last_watched_at)
      const now = new Date()
      const daysDiff = (now.getTime() - lastWatched.getTime()) / (1000 * 60 * 60 * 24)

      if (daysDiff > 30) {
        // Position expirée, la réinitialiser
        await supabase
          .from("emprunts")
          .update({ position_seconds: 0 })
          .eq("id", rental.id)

        return NextResponse.json<VideoResumeResponse>({
          success: true,
          data: null,
          message: "Position expirée (> 30 jours)"
        }, {
          headers: { 'Cache-Control': 'no-store' }
        })
      }
    }

    // Calculer la durée en secondes (duree est en minutes dans la DB)
    const movieData = rental.movies as { duree: number | null } | null
    const durationMinutes = movieData?.duree || 0
    const duration = durationMinutes * 60

    if (duration === 0) {
      return NextResponse.json<VideoResumeResponse>({
        success: true,
        data: null,
        message: "Durée du film inconnue"
      }, {
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    // Calculer le pourcentage de progression
    const percentage = Math.min(100, (position / duration) * 100)

    // Construire les données de reprise
    const resumeData: VideoResumeData = {
      position,
      duration,
      percentage,
      lastWatchedAt: rental.last_watched_at || new Date().toISOString(),
      rentalId: rental.id
    }

    return NextResponse.json<VideoResumeResponse>({
      success: true,
      data: resumeData
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error("Error in get watch session:", error)
    return NextResponse.json<VideoResumeResponse>(
      { success: false, data: null, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}
