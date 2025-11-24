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

    // Récupérer la session active avec position sauvegardée
    const { data: session, error: sessionError } = await supabase
      .from("viewing_sessions")
      .select("id, position_seconds, last_watched_at, session_start_date, return_date")
      .eq("user_id", user.id)
      .eq("movie_id", movieId)
      .eq("statut", "en_cours")
      .single()

    if (sessionError || !session) {
      return NextResponse.json<VideoResumeResponse>({
        success: true,
        data: null,
        message: "Aucune session active"
      }, {
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    // Vérifier si la position est significative (> 30 secondes)
    // En dessous de 30s, on considère que c'est le début du film
    if (!session.position_seconds || session.position_seconds < 30) {
      return NextResponse.json<VideoResumeResponse>({
        success: true,
        data: null,
        message: "Position trop proche du début"
      }, {
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    // Vérifier expiration 30 jours (optionnel)
    // Si l'utilisateur n'a pas regardé depuis > 30 jours, on ignore la position
    if (session.last_watched_at) {
      const lastWatch = new Date(session.last_watched_at)
      const daysSinceLastWatch = (Date.now() - lastWatch.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceLastWatch > 30) {
        return NextResponse.json<VideoResumeResponse>({
          success: true,
          data: null,
          message: "Position expirée (> 30 jours)"
        }, {
          headers: { 'Cache-Control': 'no-store' }
        })
      }
    }

    // Récupérer la durée totale du film depuis movies
    const { data: movieData } = await supabase
      .from("movies")
      .select("duree")
      .eq("id", movieId)
      .single()

    // Durée en secondes (duree est stockée en minutes dans movies)
    // Si durée non disponible, estimation à 2h (7200s)
    const durationInSeconds = movieData?.duree ? movieData.duree * 60 : 7200

    // Retourner les données de reprise
    const resumeData: VideoResumeData = {
      position: session.position_seconds,
      duration: durationInSeconds,
      percentage: (session.position_seconds / durationInSeconds) * 100,
      lastWatchedAt: session.last_watched_at || session.session_start_date,
      rentalId: session.id
    }

    return NextResponse.json<VideoResumeResponse>({
      success: true,
      data: resumeData
    }, {
      headers: { 'Cache-Control': 'no-store' }
    })

  } catch (error) {
    console.error("Error in get watch session:", error)
    return NextResponse.json<VideoResumeResponse>(
      { success: false, data: null, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}
