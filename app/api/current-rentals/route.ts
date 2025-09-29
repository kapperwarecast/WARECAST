import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Configuration du cache pour améliorer les performances
export const dynamic = 'force-dynamic'
export const revalidate = 30 // Revalider toutes les 30 secondes

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

    // Récupérer les paramètres de pagination
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Requête optimisée : récupérer les films et le count en une seule requête
    const { data: rentals, error: rentalsError, count } = await supabase
      .from('emprunts')
      .select(`
        id,
        date_emprunt,
        date_retour,
        statut,
        montant_paye,
        type_emprunt,
        movies (
          id,
          tmdb_id,
          titre_francais,
          titre_original,
          duree,
          genres,
          langue_vo,
          annee_sortie,
          synopsis,
          note_tmdb,
          poster_local_path,
          statut,
          movie_directors (
            directors (
              id,
              nom_complet,
              prenom,
              nom
            )
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('statut', 'en_cours')
      .order('date_emprunt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (rentalsError) {
      console.error('Error fetching current rentals:', rentalsError)
      return NextResponse.json(
        { error: 'Failed to fetch current rentals' },
        { status: 500 }
      )
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    // Transformer les données pour correspondre au format attendu
    const transformedMovies = rentals?.map((rental: any) => ({
      ...rental.movies,
      directors: rental.movies?.movie_directors?.map((md: any) => md.directors) || [],
      rental: {
        id: rental.id,
        date_emprunt: rental.date_emprunt,
        date_retour: rental.date_retour,
        statut: rental.statut,
        montant_paye: rental.montant_paye,
        type_emprunt: rental.type_emprunt
      }
    })) || []

    const response = {
      movies: transformedMovies,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
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