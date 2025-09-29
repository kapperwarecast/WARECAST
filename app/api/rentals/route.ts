import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Configuration du cache pour améliorer les performances
export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalider toutes les 60 secondes

/**
 * GET /api/rentals
 * Récupère tous les emprunts actifs de l'utilisateur connecté
 * Optimisé pour le rental-store (retourne uniquement les IDs et status)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', rentals: [] },
        { status: 401 }
      )
    }

    // Récupérer UNIQUEMENT les emprunts en cours (léger et rapide)
    const { data: rentals, error: rentalsError } = await supabase
      .from('emprunts')
      .select('id, movie_id, date_retour')
      .eq('user_id', user.id)
      .eq('statut', 'en_cours')

    if (rentalsError) {
      console.error('Error fetching user rentals:', rentalsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch rentals', rentals: [] },
        { status: 500 }
      )
    }

    // Transformer en format attendu par le store
    const transformedRentals = rentals?.map((rental: any) => ({
      movieId: rental.movie_id,
      isRented: true,
      rentalId: rental.id,
      expiresAt: rental.date_retour,
      lastSync: Date.now(),
    })) || []

    return NextResponse.json({
      success: true,
      rentals: transformedRentals,
      count: transformedRentals.length,
    })

  } catch (error) {
    console.error('Unexpected error in rentals API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', rentals: [] },
      { status: 500 }
    )
  }
}