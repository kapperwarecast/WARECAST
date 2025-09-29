import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Configuration du cache
export const dynamic = 'force-dynamic'
export const revalidate = 30

export async function POST(request: NextRequest) {
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

    // Récupérer les IDs de films depuis le body
    const { movieIds } = await request.json()

    if (!Array.isArray(movieIds) || movieIds.length === 0) {
      return NextResponse.json(
        { error: 'movieIds array is required' },
        { status: 400 }
      )
    }

    // Requête optimisée : récupérer tous les emprunts en cours pour ces films en une seule requête
    const { data: rentals, error: rentalsError } = await supabase
      .from('emprunts')
      .select('movie_id, id, statut')
      .eq('user_id', user.id)
      .eq('statut', 'en_cours')
      .in('movie_id', movieIds)

    if (rentalsError) {
      console.error('Error fetching batch rental status:', rentalsError)
      return NextResponse.json(
        { error: 'Failed to fetch rental status' },
        { status: 500 }
      )
    }

    // Créer un Map des résultats
    const statusMap: Record<string, { isCurrentlyRented: boolean; rentalId: string | null }> = {}
    
    // Initialiser tous les films à false
    movieIds.forEach(movieId => {
      statusMap[movieId] = {
        isCurrentlyRented: false,
        rentalId: null
      }
    })

    // Mettre à jour ceux qui sont loués
    rentals?.forEach(rental => {
      statusMap[rental.movie_id] = {
        isCurrentlyRented: true,
        rentalId: rental.id
      }
    })

    return NextResponse.json({ statuses: statusMap })

  } catch (error) {
    console.error('Unexpected error in batch-rental-status API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
