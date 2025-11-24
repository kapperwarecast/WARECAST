import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/films/catalogue
 * Liste tous les films du catalogue avec le nombre de copies physiques
 * Supporte la recherche serveur-side avec préfixes et normalisation accents
 *
 * Query params:
 * - search: Recherche dans titres, acteurs, réalisateurs (préfixes supportés)
 * - showProcessingOnly: Filtrer les films sans lien Vimeo
 *
 * Réservé aux administrateurs
 */
export async function GET(request: NextRequest) {
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

    // Récupérer les paramètres de recherche
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || null
    const showProcessingOnly = searchParams.get('showProcessingOnly') === 'true'

    // Utiliser la RPC admin_search_films pour recherche serveur-side
    const adminClient = createAdminClient()

    const { data: films, error: filmsError } = await adminClient.rpc('admin_search_films', {
      p_search_query: search || undefined,
      p_show_processing_only: showProcessingOnly
    })

    if (filmsError) {
      console.error('[GET /api/admin/films/catalogue] Error fetching films:', filmsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des films' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      films: films || [],
      total: films?.length || 0
    })
  } catch (error) {
    console.error('[GET /api/admin/films/catalogue] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
