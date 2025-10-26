import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { movieId } = body

    if (!movieId) {
      return NextResponse.json(
        { error: "movieId est requis" },
        { status: 400 }
      )
    }

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    // 2. Vérifier que l'utilisateur a un abonnement actif
    const { data: subscription, error: subError } = await supabase
      .from('user_abonnements')
      .select('id, date_expiration, statut')
      .eq('user_id', user.id)
      .in('statut', ['actif', 'résilié'])
      .gt('date_expiration', new Date().toISOString())
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "Aucun abonnement actif trouvé" },
        { status: 403 }
      )
    }

    // 3. Vérifier que le film existe et a des copies disponibles
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('id, copies_disponibles, titre_francais, titre_original')
      .eq('id', movieId)
      .single()

    if (movieError || !movie) {
      return NextResponse.json(
        { error: "Film non trouvé" },
        { status: 404 }
      )
    }

    if (movie.copies_disponibles <= 0) {
      return NextResponse.json(
        { error: "Aucune copie disponible pour ce film" },
        { status: 409 }
      )
    }

    // 4. Libérer l'ancien emprunt en cours de l'abonné (s'il existe)
    const { data: currentRental } = await supabase
      .from('emprunts')
      .select('id')
      .eq('user_id', user.id)
      .eq('statut', 'en_cours')
      .eq('type_emprunt', 'abonnement')
      .maybeSingle()

    if (currentRental) {
      // Marquer l'ancien emprunt comme rendu
      // Le trigger handle_rental_return remettra automatiquement la copie disponible
      const { error: returnError } = await supabase
        .from('emprunts')
        .update({
          statut: 'rendu',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentRental.id)

      if (returnError) {
        console.error('Erreur lors de la libération de l\'ancien emprunt:', returnError)
        return NextResponse.json(
          { error: "Erreur lors de la libération de l'ancien emprunt" },
          { status: 500 }
        )
      }
    }

    // 5. Créer le nouvel emprunt
    // Le trigger handle_rental_created décrémentera automatiquement les copies disponibles
    const dateEmprunt = new Date()
    const dateRetour = new Date()
    dateRetour.setHours(dateRetour.getHours() + 48) // 48h pour les abonnés aussi

    const { data: newRental, error: rentalError } = await supabase
      .from('emprunts')
      .insert({
        user_id: user.id,
        movie_id: movieId,
        date_emprunt: dateEmprunt.toISOString(),
        date_retour: dateRetour.toISOString(),
        statut: 'en_cours',
        montant_paye: 0, // Pas de paiement pour les abonnés
        type_emprunt: 'abonnement'
      })
      .select('id')
      .single()

    if (rentalError) {
      console.error('Erreur lors de la création de l\'emprunt:', rentalError)
      return NextResponse.json(
        { error: "Erreur lors de la création de l'emprunt" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rentalId: newRental.id,
      movieId: movieId,
      dateRetour: dateRetour.toISOString()
    })

  } catch (error) {
    console.error('Erreur API create-subscription-borrow:', error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}