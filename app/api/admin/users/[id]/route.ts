import { createClient, createAdminClient } from '@/lib/supabase/server'
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
    const adminClient = createAdminClient()

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
      console.error('[DELETE /api/admin/users/[id]] User not found in user_profiles:', {
        targetUserId,
        error: targetProfileError
      })

      // Vérifier si l'utilisateur existe dans auth.users mais pas dans user_profiles
      const { data: authUser, error: authUserError } = await adminClient.auth.admin.getUserById(targetUserId)

      console.log('[DELETE /api/admin/users/[id]] getUserById result:', {
        hasData: !!authUser,
        hasUser: !!authUser?.user,
        error: authUserError
      })

      if (authUserError) {
        console.error('[DELETE /api/admin/users/[id]] Error fetching auth user:', authUserError)
        return NextResponse.json(
          { error: `Erreur lors de la vérification du compte auth: ${authUserError.message}` },
          { status: 500 }
        )
      }

      if (authUser?.user) {
        console.log('[DELETE /api/admin/users/[id]] User exists in auth but not in user_profiles')

        // Nettoyer les données de l'utilisateur orphelin AVANT suppression
        console.log('[DELETE /api/admin/users/[id]] Cleaning orphan user data...')

        // 1. Supprimer les likes
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', targetUserId)

        // 2. Supprimer les sessions de visionnage
        await supabase
          .from('viewing_sessions')
          .delete()
          .eq('user_id', targetUserId)

        // 3. Supprimer les abonnements
        await supabase
          .from('user_abonnements')
          .delete()
          .eq('user_id', targetUserId)

        // 4. Redistribuer les films (si l'utilisateur en possède)
        const { data: redistributionResult, error: redistributionError } = await supabase
          .rpc('redistribute_user_films', { p_user_id: targetUserId })

        if (redistributionError) {
          console.error('[DELETE /api/admin/users/[id]] Error redistributing orphan user films:', redistributionError)
          // Continue quand même
        } else {
          console.log(`[DELETE /api/admin/users/[id]] ${redistributionResult} orphan film(s) redistributé(s)`)
        }

        // 5. Supprimer les sponsorships (parrainages)
        await supabase
          .from('sponsorships')
          .delete()
          .or(`sponsor_id.eq.${targetUserId},sponsored_user_id.eq.${targetUserId}`)

        // 6. Maintenant on peut supprimer de auth.users
        const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(targetUserId)

        if (deleteAuthError) {
          console.error('[DELETE /api/admin/users/[id]] Error deleting auth-only user:', deleteAuthError)
          return NextResponse.json(
            { error: 'Erreur lors de la suppression du compte auth' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Compte auth supprimé (profil introuvable)',
          films_redistributed: redistributionResult || 0
        })
      }

      console.log('[DELETE /api/admin/users/[id]] User not found in auth.users either')
      return NextResponse.json(
        { error: 'Utilisateur non trouvé dans le système' },
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

    // 2. Supprimer les sessions de visionnage (contient les infos de paiement)
    await supabase
      .from('viewing_sessions')
      .delete()
      .eq('user_id', targetUserId)

    // 3. Supprimer les abonnements
    await supabase
      .from('user_abonnements')
      .delete()
      .eq('user_id', targetUserId)

    // 4. Redistribuer les films de l'utilisateur avant suppression
    const { data: redistributionResult, error: redistributionError } = await supabase
      .rpc('redistribute_user_films', { p_user_id: targetUserId })

    if (redistributionError) {
      console.error('[DELETE /api/admin/users/[id]] Error redistributing films:', redistributionError)
      // Si erreur de redistribution, on continue quand même car :
      // - Soit l'utilisateur n'a pas de films (normal)
      // - Soit erreur FK qui sera gérée par CASCADE maintenant
    } else {
      console.log(`[DELETE /api/admin/users/[id]] ${redistributionResult} film(s) redistribué(s)`)
    }

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
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(targetUserId)

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
      message: 'Utilisateur supprimé avec succès',
      films_redistributed: redistributionResult || 0
    })
  } catch (error) {
    console.error('[DELETE /api/admin/users/[id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
