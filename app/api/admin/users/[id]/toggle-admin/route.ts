import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/users/[id]/toggle-admin
 * Toggle le statut administrateur d'un utilisateur
 * Réservé aux administrateurs
 */
export async function POST(
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

    // Empêcher un admin de se retirer lui-même les droits admin
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier vos propres droits administrateur' },
        { status: 400 }
      )
    }

    // Récupérer le statut actuel de l'utilisateur cible
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', targetUserId)
      .single()

    if (targetProfileError || !targetProfile) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Toggle le statut admin
    const newAdminStatus = !targetProfile.is_admin

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ is_admin: newAdminStatus })
      .eq('id', targetUserId)

    if (updateError) {
      console.error('[POST /api/admin/users/[id]/toggle-admin] Error updating admin status:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la modification du statut' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      is_admin: newAdminStatus,
      message: newAdminStatus
        ? 'Utilisateur promu administrateur'
        : 'Droits administrateur retirés'
    })
  } catch (error) {
    console.error('[POST /api/admin/users/[id]/toggle-admin] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
