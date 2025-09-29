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
    const { id: movieId } = await params

    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: "Vous devez être connecté pour emprunter un film"
      }, { status: 401 })
    }

    // Vérifier d'abord si l'utilisateur a un abonnement actif
    const { data: userSubscription, error: subscriptionError } = await supabase
      .from("user_abonnements")
      .select("*")
      .eq("user_id", user.id)
      .eq("statut", "actif")
      .gt("date_expiration", new Date().toISOString())
      .limit(1)
      .single()

    if (subscriptionError && subscriptionError.code !== "PGRST116") {
      console.error("Erreur lors de la vérification de l'abonnement:", subscriptionError)
      return NextResponse.json({
        success: false,
        error: "Erreur technique lors de la vérification de l'abonnement"
      }, { status: 500 })
    }

    // Si l'utilisateur a un abonnement actif, permettre l'accès direct
    if (userSubscription) {
      // Créer ou vérifier l'emprunt pour les utilisateurs abonnés
      const { data: existingRental } = await supabase
        .from("emprunts")
        .select("id")
        .eq("user_id", user.id)
        .eq("movie_id", movieId)
        .eq("statut", "actif")
        .single()

      let rentalId = existingRental?.id

      if (!existingRental) {
        // Libérer tout emprunt existant et créer le nouveau
        await supabase
          .from("emprunts")
          .update({ statut: "termine", date_retour: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("statut", "actif")

        // Créer le nouvel emprunt
        const { data: newRental, error: rentalError } = await supabase
          .from("emprunts")
          .insert({
            user_id: user.id,
            movie_id: movieId,
            statut: "actif"
          })
          .select("id")
          .single()

        if (rentalError) {
          console.error("Erreur lors de la création de l'emprunt:", rentalError)
          return NextResponse.json({
            success: false,
            error: "Impossible de créer l'emprunt"
          }, { status: 500 })
        }

        rentalId = newRental.id
      }

      return NextResponse.json({
        success: true,
        existing_rental: !!existingRental,
        emprunt_id: rentalId,
        subscription_access: true
      })
    }

    // Si pas d'abonnement, récupérer les détails du film pour la modal
    const { data: movie, error: movieError } = await supabase
      .from("movies")
      .select("titre_francais, titre_original")
      .eq("id", movieId)
      .single()

    if (movieError) {
      console.error("Erreur lors de la récupération du film:", movieError)
      return NextResponse.json({
        success: false,
        error: "Film introuvable"
      }, { status: 404 })
    }

    // Utilisateur sans abonnement → modal de choix
    return NextResponse.json({
      success: false,
      requires_payment_choice: true,
      movie_title: movie.titre_francais || movie.titre_original || "Film",
      rental_price: 1.50
    }, { status: 409 })

  } catch (error) {
    console.error("Erreur API rent:", error)
    return NextResponse.json({
      success: false,
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}