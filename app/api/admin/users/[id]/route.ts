import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/admin/users/[id]
 * Supprime un utilisateur et toutes ses données associées
 * Réservé aux administrateurs
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les droits admin de l'appelant
    const { data: callerProfile, error: callerProfileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (callerProfileError || !callerProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Accès interdit - droits administrateur requis' },
        { status: 403 }
      )
    }

    // Empêcher un admin de se supprimer lui-même
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur cible existe
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', targetUserId)
      .single()

    if (targetProfileError || !targetProfile) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer les données associées dans l'ordre (pour éviter les contraintes FK)
    // Note: Si les FK ont ON DELETE CASCADE, ces étapes sont automatiques

    // 1. Supprimer les likes
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', targetUserId)

    // 2. Supprimer les emprunts (et leurs paiements associés via FK cascade)
    await supabase
      .from('emprunts')
      .delete()
      .eq('user_id', targetUserId)

    // 3. Supprimer les paiements (si pas déjà supprimés par cascade)
    await supabase
      .from('payments')
      .delete()
      .eq('user_id', targetUserId)

    // 4. Supprimer les abonnements
    await supabase
      .from('user_abonnements')
      .delete()
      .eq('user_id', targetUserId)

    // 5. Supprimer le profil utilisateur
    const { error: deleteProfileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', targetUserId)

    if (deleteProfileError) {
      console.error('[DELETE /api/admin/users/[id]] Error deleting profile:', deleteProfileError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du profil' },
        { status: 500 }
      )
    }

    // 6. Supprimer l'utilisateur de auth.users (nécessite admin)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(targetUserId)

    if (deleteAuthError) {
      console.error('[DELETE /api/admin/users/[id]] Error deleting auth user:', deleteAuthError)
      // Continue même si erreur car le profil est déjà supprimé
      return NextResponse.json({
        success: true,
        warning: 'Profil supprimé mais erreur lors de la suppression du compte auth'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    })
  } catch (error) {
    console.error('[DELETE /api/admin/users/[id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
