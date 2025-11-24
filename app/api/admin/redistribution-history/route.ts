import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/redistribution-history
 * Récupère l'historique des redistributions récentes
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

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

    // Récupérer l'historique des redistributions récentes (dernières 24h)
    const { data: history, error: historyError } = await adminClient
      .from('ownership_history')
      .select(`
        id,
        transfer_date,
        transfer_type,
        film_registry_id,
        films_registry!inner (
          movie_id,
          movies!inner (
            title_fr,
            title_original
          )
        ),
        user_profiles!ownership_history_to_owner_id_fkey (
          id,
          prenom,
          nom,
          username,
          email
        )
      `)
      .eq('transfer_type', 'redistribution')
      .gte('transfer_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('transfer_date', { ascending: false })
      .limit(50)

    if (historyError) {
      console.error('[GET /api/admin/redistribution-history] Error:', historyError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'historique' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      history: history || []
    })
  } catch (error) {
    console.error('[GET /api/admin/redistribution-history] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
