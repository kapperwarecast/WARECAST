import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/films/[id]
 * Récupère un film spécifique
 * Réservé aux administrateurs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: filmId } = await params
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

    // Récupérer le film
    const adminClient = createAdminClient()
    const { data: film, error: filmError } = await adminClient
      .from('movies')
      .select('*')
      .eq('id', filmId)
      .single()

    if (filmError || !film) {
      return NextResponse.json(
        { error: 'Film non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ film })
  } catch (error) {
    console.error('[GET /api/admin/films/[id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/films/[id]
 * Met à jour un film
 * Réservé aux administrateurs
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: filmId } = await params
    const body = await request.json()
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

    // Mettre à jour le film
    const adminClient = createAdminClient()
    const { data: updatedFilm, error: updateError } = await adminClient
      .from('movies')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', filmId)
      .select()
      .single()

    if (updateError) {
      console.error('[PATCH /api/admin/films/[id]] Error updating film:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du film' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      film: updatedFilm
    })
  } catch (error) {
    console.error('[PATCH /api/admin/films/[id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/films/[id]
 * Supprime un film du catalogue
 * Note: Les copies physiques doivent être supprimées d'abord (CASCADE ou manuel)
 * Réservé aux administrateurs
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: filmId } = await params
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

    const adminClient = createAdminClient()

    // Vérifier s'il y a des copies physiques
    const { data: copies, error: copiesError } = await adminClient
      .from('films_registry')
      .select('id')
      .eq('movie_id', filmId)

    if (copiesError) {
      console.error('[DELETE /api/admin/films/[id]] Error checking copies:', copiesError)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des copies' },
        { status: 500 }
      )
    }

    if (copies && copies.length > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: ${copies.length} copie(s) physique(s) existent encore` },
        { status: 400 }
      )
    }

    // Supprimer le film
    const { error: deleteError } = await adminClient
      .from('movies')
      .delete()
      .eq('id', filmId)

    if (deleteError) {
      console.error('[DELETE /api/admin/films/[id]] Error deleting film:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du film' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Film supprimé avec succès'
    })
  } catch (error) {
    console.error('[DELETE /api/admin/films/[id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
