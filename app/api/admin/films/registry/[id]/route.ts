import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * DELETE /api/admin/films/registry/[id]
 * Supprime une entrée du registre de propriété
 * Réservé aux administrateurs
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Vérifier que l'entrée existe
    const { data: entry, error: fetchError } = await adminClient
      .from('films_registry')
      .select('id, movie_id')
      .eq('id', id)
      .single()

    if (fetchError || !entry) {
      return NextResponse.json(
        { error: 'Entrée non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier qu'il n'y a pas de session active sur cette copie
    const { data: activeSession } = await adminClient
      .from('viewing_sessions')
      .select('id')
      .eq('registry_id', id)
      .eq('statut', 'en_cours')
      .single()

    if (activeSession) {
      return NextResponse.json(
        { error: 'Impossible de supprimer - une session de lecture est en cours sur cette copie' },
        { status: 400 }
      )
    }

    // Supprimer d'abord l'historique de propriété lié
    await adminClient
      .from('ownership_history')
      .delete()
      .eq('registry_id', id)

    // Supprimer les sessions de lecture liées (terminées/expirées)
    await adminClient
      .from('viewing_sessions')
      .delete()
      .eq('registry_id', id)

    // Supprimer l'entrée du registre
    const { error: deleteError } = await adminClient
      .from('films_registry')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[DELETE /api/admin/films/registry/[id]] Error:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Entrée supprimée du registre'
    })
  } catch (error) {
    console.error('[DELETE /api/admin/films/registry/[id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
