import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Configuration du cache pour améliorer les performances
export const dynamic = 'force-dynamic'
export const revalidate = 30 // Revalider toutes les 30 secondes

/**
 * GET /api/current-rentals
 * DEPRECATED: Cet endpoint est obsolète dans le système de propriété
 *
 * L'ancien système de location a été remplacé par un système de propriété.
 * Les utilisateurs doivent maintenant utiliser /ma-collection au lieu de /films-en-cours
 *
 * Cet endpoint est conservé pour compatibilité mais retourne une liste vide.
 * Pour obtenir les films possédés, utilisez /api/rentals (qui a été migré vers films_registry)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Récupérer les paramètres de pagination pour compatibilité
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // DEPRECATED: Retourner une réponse vide mais au bon format
    // Les clients doivent migrer vers /api/rentals ou utiliser directement Ma Collection
    const response = {
      movies: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      deprecated: true,
      message: 'This endpoint is deprecated. Please use /ma-collection page or /api/rentals endpoint.'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Unexpected error in current-rentals API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}