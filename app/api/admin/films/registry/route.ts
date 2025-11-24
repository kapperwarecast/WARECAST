import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/films/registry
 * Liste toutes les copies physiques avec infos film + propriétaire + disponibilité
 * Réservé aux administrateurs
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

    // Récupérer toutes les copies avec infos complètes
    const { data: registry, error: registryError } = await adminClient
      .from('films_registry')
      .select(`
        *,
        movie:movies(
          id,
          titre_francais,
          titre_original,
          poster_local_path,
          annee_sortie
        ),
        owner:user_profiles!films_registry_current_owner_id_fkey(
          id,
          prenom,
          nom,
          username
        )
      `)
      .order('created_at', { ascending: false })

    if (registryError) {
      console.error('[GET /api/admin/films/registry] Error fetching registry:', registryError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du registre' },
        { status: 500 }
      )
    }

    // ⚡ OPTIMISATION : Récupérer tous les emails et sessions en une seule fois

    // 1. Extraire tous les IDs de propriétaires uniques
    const ownerIds = [...new Set(registry.map(entry => entry.current_owner_id))]

    // 2. Récupérer tous les emails en une seule requête
    const emailsMap = new Map<string, string>()
    try {
      const { data: authUsers } = await adminClient.auth.admin.listUsers({
        perPage: 1000 // Limite max
      })
      authUsers.users.forEach(user => {
        if (user.email) {
          emailsMap.set(user.id, user.email)
        }
      })
    } catch (err) {
      console.error('[GET /api/admin/films/registry] Error fetching emails:', err)
    }

    // 3. Récupérer toutes les sessions actives en une seule requête
    const { data: activeSessions } = await adminClient
      .from('viewing_sessions')
      .select('registry_id')
      .eq('statut', 'en_cours')

    const activeRegistryIds = new Set(activeSessions?.map(s => s.registry_id) || [])

    // 4. Mapper les données en mémoire (O(n) au lieu de O(n²))
    const registryWithEmails = registry.map(entry => ({
      ...entry,
      owner_email: emailsMap.get(entry.current_owner_id) || null,
      is_available: !activeRegistryIds.has(entry.id)
    }))

    // Récupérer les dépôts en attente (sent, received) - AVEC emails
    const { data: pendingDeposits, error: depositsError } = await adminClient.rpc(
      'admin_get_pending_deposits',
      { p_admin_id: user.id }
    )

    if (depositsError) {
      console.error('[GET /api/admin/films/registry] Error fetching pending deposits:', depositsError)
    }

    return NextResponse.json({
      registry: registryWithEmails,
      total: registryWithEmails.length,
      pendingDeposits: pendingDeposits || []
    })
  } catch (error) {
    console.error('[GET /api/admin/films/registry] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue' },
      { status: 500 }
    )
  }
}
