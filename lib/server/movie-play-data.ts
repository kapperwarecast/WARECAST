import { createClient } from "@/lib/supabase/server"
import type { MoviePlayData } from "@/types"

/**
 * Récupère toutes les données nécessaires pour déterminer l'état du bouton Play
 * Côté serveur, en une seule passe
 */
export async function getMoviePlayData(movieId: string): Promise<MoviePlayData | null> {
  try {
    const supabase = await createClient()

    // 1. Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Si pas d'utilisateur, retourner un état par défaut
    if (userError || !user) {
      // Récupérer juste les copies disponibles
      const { data: movieData } = await supabase
        .from("movies")
        .select("copies_disponibles")
        .eq("id", movieId)
        .single()

      return {
        hasActiveSubscription: false,
        isCurrentlyRented: false,
        rentalExpiresAt: null,
        copiesDisponibles: movieData?.copies_disponibles ?? 0,
      }
    }

    // 2. Récupérer en parallèle :
    //    - L'abonnement utilisateur
    //    - L'emprunt en cours pour ce film
    //    - Les copies disponibles
    const [subscriptionResult, rentalResult, movieResult] = await Promise.all([
      // Abonnement
      supabase
        .from("user_abonnements")
        .select("id, date_expiration, statut")
        .eq("user_id", user.id)
        .in("statut", ["actif", "résilié"])
        .order("date_expiration", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Emprunt en cours
      supabase
        .from("emprunts")
        .select("id, date_retour, statut")
        .eq("user_id", user.id)
        .eq("movie_id", movieId)
        .eq("statut", "en_cours")
        .maybeSingle(),

      // Copies disponibles
      supabase
        .from("movies")
        .select("copies_disponibles")
        .eq("id", movieId)
        .single(),
    ])

    // 3. Calculer hasActiveSubscription
    const hasActiveSubscription = Boolean(
      subscriptionResult.data &&
      (subscriptionResult.data.statut === "actif" || subscriptionResult.data.statut === "résilié") &&
      new Date(subscriptionResult.data.date_expiration) > new Date()
    )

    // 4. Calculer isCurrentlyRented
    const isCurrentlyRented = Boolean(rentalResult.data)
    const rentalExpiresAt = rentalResult.data?.date_retour || null

    // 5. Récupérer copies_disponibles
    const copiesDisponibles = movieResult.data?.copies_disponibles ?? 0

    return {
      hasActiveSubscription,
      isCurrentlyRented,
      rentalExpiresAt,
      copiesDisponibles,
    }
  } catch (error) {
    console.error("Error fetching movie play data:", error)
    return null
  }
}
