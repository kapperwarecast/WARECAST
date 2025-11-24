import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/films/[id]/history
 * Récupère l'historique complet des transferts de propriété pour une copie physique
 * Réservé aux administrateurs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registryId } = await params
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

    // Récupérer la copie physique
    const { data: registry, error: registryError } = await adminClient
      .from('films_registry')
      .select(`
        id,
        movie_id,
        current_owner_id,
        acquisition_method,
        physical_support_type,
        acquisition_date,
        movies(titre_francais, titre_original, poster_local_path)
      `)
      .eq('id', registryId)
      .single()

    if (registryError || !registry) {
      return NextResponse.json(
        { error: 'Copie physique non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer l'historique des transferts
    const { data: history, error: historyError } = await adminClient
      .from('ownership_history')
      .select(`
        id,
        from_owner_id,
        to_owner_id,
        transfer_type,
        transfer_date,
        from_owner:user_profiles!ownership_history_from_owner_id_fkey(id, prenom, nom, username),
        to_owner:user_profiles!ownership_history_to_owner_id_fkey(id, prenom, nom, username)
      `)
      .eq('film_registry_id', registryId)
      .order('transfer_date', { ascending: false })

    if (historyError) {
      console.error('[GET /api/admin/films/[id]/history] Error fetching history:', historyError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'historique' },
        { status: 500 }
      )
    }

    // Récupérer les emails des utilisateurs via auth.admin
    const historyWithEmails = await Promise.all(
      (history || []).map(async (transfer) => {
        let fromEmail = null
        let toEmail = null

        try {
          if (transfer.from_owner_id) {
            const { data: fromUser } = await adminClient.auth.admin.getUserById(transfer.from_owner_id)
            fromEmail = fromUser?.user?.email || null
          }
          if (transfer.to_owner_id) {
            const { data: toUser } = await adminClient.auth.admin.getUserById(transfer.to_owner_id)
            toEmail = toUser?.user?.email || null
          }
        } catch (err) {
          console.error('Error fetching user emails:', err)
        }

        return {
          ...transfer,
          from_email: fromEmail,
          to_email: toEmail
        }
      })
    )

    return NextResponse.json({
      registry,
      history: historyWithEmails,
      total_transfers: historyWithEmails.length
    })
  } catch (error) {
    console.error('[GET /api/admin/films/[id]/history] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
