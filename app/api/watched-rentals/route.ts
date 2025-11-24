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
      .from('viewing_sessions')
      .select(`
        id,
        created_at,
        return_date,
        statut,
        amount_paid,
        session_type,
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
          movie_directors (
            directors (
              id,
              nom_complet
            )
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .in('statut', ['rendu', 'expiré'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (rentalsError) {
      console.error('Error fetching watched rentals:', rentalsError)
      return NextResponse.json(
        { error: 'Failed to fetch watched rentals' },
        { status: 500 }
      )
    }

    // Transformer les données pour correspondre au format attendu
    const transformedMovies = rentals?.map((rental) => {
      const movies = rental.movies as Record<string, unknown> | null
      return {
        ...(movies || {}),
        directors: rental.movies?.movie_directors?.map((md) => md.directors) || [],
        rental: {
          id: rental.id,
          date_emprunt: rental.created_at,
          date_retour: rental.return_date,
          statut: rental.statut,
          montant_paye: rental.amount_paid,
          type_emprunt: rental.session_type
        }
      }
    }) || []

    // Dédupliquer les films (garder seulement la session la plus récente pour chaque film)
    const uniqueMovies = transformedMovies.reduce((acc, movie) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const movieId = (movie as any).id as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!acc.find(m => (m as any).id === movieId)) {
        acc.push(movie)
      }
      return acc
    }, [] as typeof transformedMovies)

    // Ajuster la pagination en fonction du nombre de films uniques
    const actualTotal = uniqueMovies.length
    const totalPages = Math.ceil((count || 0) / limit) // Basé sur le total de sessions
    const hasMoreData = rentals && rentals.length === limit

    const response = {
      movies: uniqueMovies,
      pagination: {
        page,
        limit,
        total: count || 0, // Total de sessions
        totalPages,
        hasNextPage: hasMoreData, // Il y a plus de données si on a reçu le nombre max
        hasPreviousPage: page > 1
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Unexpected error in watched-rentals API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
