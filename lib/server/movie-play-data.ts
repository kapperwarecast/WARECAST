import { createClient } from "@/lib/supabase/server"
import type { MoviePlayData } from "@/types"

/**
 * Récupère toutes les données nécessaires pour déterminer l'état du bouton Play
 * Côté serveur, en une seule passe
 *
 * NOTE: Mis à jour pour le système de propriété
 * - isCurrentlyRented vérifie maintenant la propriété dans films_registry
 * - copiesDisponibles n'est plus utilisé (toujours 0 pour compatibilité)
 */
export async function getMoviePlayData(movieId: string): Promise<MoviePlayData | null> {
  try {
    const supabase = await createClient()

    // 1. Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Si pas d'utilisateur, retourner un état par défaut
    if (userError || !user) {
      return {
        hasActiveSubscription: false,
        isCurrentlyRented: false,
        rentalExpiresAt: null,
        copiesDisponibles: 0, // Toujours 0 dans le nouveau système
      }
    }

    // 2. Récupérer en parallèle :
    //    - L'abonnement utilisateur
    //    - La propriété du film (nouveau système)
    const [subscriptionResult, ownershipResult] = await Promise.all([
      // Abonnement
      supabase
        .from("user_abonnements")
        .select("id, date_expiration, statut")
        .eq("user_id", user.id)
        .in("statut", ["actif", "résilié"])
        .order("date_expiration", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Vérifier si l'utilisateur possède ce film
      // Type cast needed: films_registry table exists in DB but not in generated types yet
      (supabase.from as unknown as (table: string) => ReturnType<typeof supabase.from<any>>)("films_registry")
        .select("id, acquisition_date")
        .eq("current_owner_id", user.id)
        .eq("movie_id", movieId)
        .maybeSingle(),
    ])

    // 3. Calculer hasActiveSubscription
    const hasActiveSubscription = Boolean(
      subscriptionResult.data &&
      (subscriptionResult.data.statut === "actif" || subscriptionResult.data.statut === "résilié") &&
      new Date(subscriptionResult.data.date_expiration) > new Date()
    )

    // 4. Dans le nouveau système, "rented" signifie "owned"
    const isCurrentlyRented = Boolean(ownershipResult.data)
    // Pas d'expiration dans le système de propriété (propriété permanente)
    const rentalExpiresAt = null

    return {
      hasActiveSubscription,
      isCurrentlyRented,
      rentalExpiresAt,
      copiesDisponibles: 0, // Obsolète dans le nouveau système
    }
  } catch (error) {
    console.error("Error fetching movie play data:", error)
    return null
  }
}
