import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/films/catalogue
 * Liste tous les films du catalogue avec le nombre de copies physiques
 * Réservé aux administrateurs
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les droits admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Accès interdit - droits administrateur requis' },
        { status: 403 }
      )
    }

    // Récupérer tous les films avec le count des copies physiques
    const adminClient = createAdminClient()

    const { data: films, error: filmsError } = await adminClient
      .from('movies')
      .select(`
        *,
        copies:films_registry(count)
      `)
      .order('created_at', { ascending: false })

    if (filmsError) {
      console.error('[GET /api/admin/films/catalogue] Error fetching films:', filmsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des films' },
        { status: 500 }
      )
    }

    // Formatter les données pour inclure le count
    const formattedFilms = films.map(film => ({
      ...film,
      copies_count: film.copies?.[0]?.count || 0
    }))

    return NextResponse.json({
      films: formattedFilms,
      total: formattedFilms.length
    })
  } catch (error) {
    console.error('[GET /api/admin/films/catalogue] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
