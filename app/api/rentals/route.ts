import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Configuration du cache pour améliorer les performances
export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalider toutes les 60 secondes

/**
 * GET /api/rentals
 * UPDATED: Récupère tous les films possédés par l'utilisateur connecté
 * Migré du système de location (emprunts) vers le système de propriété (films_registry)
 * Optimisé pour le rental-store (retourne uniquement les IDs et status)
 * Note: Le nom "rentals" est conservé pour compatibilité, mais représente maintenant la propriété
 */
export async function GET() {
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

    // Récupérer les films possédés depuis films_registry
    const { data: ownedFilms, error: ownershipError } = await supabase
      .from('films_registry')
      .select('id, movie_id, acquisition_date')
      .eq('current_owner_id', user.id)

    if (ownershipError) {
      console.error('Error fetching user owned films:', ownershipError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch owned films', rentals: [] },
        { status: 500 }
      )
    }

    // Transformer en format attendu par le store (compatible avec l'ancien format)
    const transformedRentals = ownedFilms?.map((film) => ({
      movieId: film.movie_id,
      isRented: true, // Conservé pour compatibilité - signifie "isOwned" maintenant
      rentalId: film.id, // ID de l'entrée dans films_registry
      expiresAt: null, // Pas d'expiration dans le système de propriété
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